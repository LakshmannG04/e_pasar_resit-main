// Enhanced Communication/Messaging System with Reporting and Admin Assignment
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { checkAuth } = require('../functions/checkAuth');
const { DISPUTE, DISPUTE_MSG, USERS, REPORT } = require('../models');
const { Op } = require('sequelize');

// Setup multer for report attachments
const reportAttachmentsPath = path.join(__dirname, '..', 'uploads', 'reports');
if (!fs.existsSync(reportAttachmentsPath)) {
    fs.mkdirSync(reportAttachmentsPath, { recursive: true });
}

const reportStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, reportAttachmentsPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `report_${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const uploadReportAttachments = multer({ 
    storage: reportStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        // Allow images, documents, and text files
        const allowedMimes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'text/plain', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
        }
    }
});

// Admin assignment helper function
const assignAdminToReport = async () => {
    try {
        // Get all available admins (Admin and SuperAdmin)
        const admins = await USERS.findAll({
            where: {
                UserAuth: {
                    [Op.in]: ['Admin', 'SuperAdmin']
                },
                // Add any additional criteria (active status, etc.)
            },
            attributes: ['UserID', 'Username', 'UserAuth']
        });

        if (admins.length === 0) {
            throw new Error('No available admins found');
        }

        // Simple round-robin assignment based on report count
        const adminWorkload = await Promise.all(
            admins.map(async (admin) => {
                const reportCount = await REPORT.count({
                    where: {
                        AssignedAdminID: admin.UserID,
                        Status: {
                            [Op.in]: ['Pending', 'Under Review']
                        }
                    }
                });
                return {
                    admin: admin,
                    workload: reportCount
                };
            })
        );

        // Assign to admin with lowest workload
        adminWorkload.sort((a, b) => a.workload - b.workload);
        return adminWorkload[0].admin;

    } catch (error) {
        console.error('Error assigning admin:', error);
        // Fallback: just return first available admin
        const fallbackAdmin = await USERS.findOne({
            where: { UserAuth: { [Op.in]: ['Admin', 'SuperAdmin'] } }
        });
        return fallbackAdmin;
    }
};

// Search users by username (for starting conversations)
router.get('/search-users', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const { username } = req.query;
        const currentUser = req.user;

        if (!username || username.trim() === '') {
            return res.status(400).json({
                status: 400,
                message: 'Username search term is required'
            });
        }

        let searchConditions = {
            Username: {
                [Op.like]: `%${username.trim()}%`
            },
            UserID: {
                [Op.ne]: currentUser.id // Exclude current user
            }
        };

        // Communication rules: 
        // - Buyers/Sellers can contact each other
        // - Users can only contact Admins if Admin contacted them first (we'll check this in create-dispute)
        // - Admins can contact anyone
        if (currentUser.userAuth === 'User' || currentUser.userAuth === 'Seller') {
            // Buyers and Sellers can search for Users and Sellers, but NOT Admins or SuperAdmins
            searchConditions.UserAuth = {
                [Op.in]: ['User', 'Seller']
            };
            
            // Additional explicit exclusion of any admin roles for extra safety
            searchConditions.UserAuth = {
                [Op.and]: [
                    { [Op.in]: ['User', 'Seller'] },
                    { [Op.not]: 'Admin' },
                    { [Op.not]: 'SuperAdmin' }
                ]
            };
            
            console.log(`🔍 User search by ${currentUser.userAuth} (${currentUser.username}) - filtering out admin users`);
        } else {
            // Admins and SuperAdmins can search for anyone
            console.log(`🔍 Admin user search by ${currentUser.userAuth} (${currentUser.username}) - no filtering`);
        }

        // Search for users by username (case-insensitive partial match)
        const users = await USERS.findAll({
            where: searchConditions,
            attributes: ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth'],
            limit: 10 // Limit results for performance
        });

        res.status(200).json({
            status: 200,
            message: 'Users found successfully',
            data: users
        });

    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({
            status: 500,
            message: 'Error searching users'
        });
    }
});

// Create new dispute/communication thread (updated to accept username)
router.post('/create-dispute', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const { title, description, lodgedAgainst, targetUsername, priority = 'Medium' } = req.body;
        const user = req.user;

        if (!title || !description || (!lodgedAgainst && !targetUsername)) {
            return res.status(400).json({
                status: 400,
                message: 'Title, description, and target user (ID or username) are required'
            });
        }

        let targetUser;

        // If username is provided, find user by username
        if (targetUsername) {
            targetUser = await USERS.findOne({ where: { Username: targetUsername } });
            if (!targetUser) {
                return res.status(404).json({
                    status: 404,
                    message: `User with username '${targetUsername}' not found`
                });
            }
        } else {
            // Fallback to ID-based search for backward compatibility
            targetUser = await USERS.findOne({ where: { UserID: lodgedAgainst } });
            if (!targetUser) {
                return res.status(404).json({
                    status: 404,
                    message: 'Target user not found'
                });
            }
        }

        // Create dispute
        const dispute = await DISPUTE.create({
            Title: title,
            Description: description,
            LodgedBy: user.id,
            LodgedAgainst: targetUser.UserID,
            Priority: priority,
            Status: 'Open'
        });

        // Add initial system message
        await DISPUTE_MSG.create({
            DisputeID: dispute.DisputeID,
            SentBy: user.id,
            Message: `Conversation started with ${targetUser.FirstName} ${targetUser.LastName} (@${targetUser.Username})`,
            MessageType: 'system'
        });

        res.status(200).json({
            status: 200,
            message: 'Communication thread created successfully',
            data: dispute
        });

    } catch (error) {
        console.error('Error creating dispute:', error);
        res.status(500).json({
            status: 500,
            message: 'Error creating communication thread'
        });
    }
});

// Get all disputes/conversations for a user
router.get('/my-conversations', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const user = req.user;
        const { status = 'all' } = req.query;

        let whereClause = {
            [Op.or]: [
                { LodgedBy: user.id },
                { LodgedAgainst: user.id }
            ]
        };

        // Add status filter if specified
        if (status !== 'all') {
            whereClause.Status = status;
        }

        // MODIFIED ADMIN ACCESS: Admins only see reported conversations (conversations they're assigned to handle)
        if (user.userAuth === 'Admin' || user.userAuth === 'SuperAdmin') {
            // Get report IDs where this admin is assigned
            const assignedReports = await REPORT.findAll({
                where: { AssignedAdminID: user.id },
                attributes: ['AdminConversationID']
            });

            const adminConversationIds = assignedReports.map(report => report.AdminConversationID).filter(id => id !== null);
            
            whereClause = {
                [Op.or]: [
                    { LodgedBy: user.id },
                    { LodgedAgainst: user.id },
                    { DisputeID: { [Op.in]: adminConversationIds } } // Only assigned admin conversations
                ]
            };
        }

        const disputes = await DISPUTE.findAll({
            where: whereClause,
            include: [
                {
                    model: USERS,
                    as: 'Complainant',
                    attributes: ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth']
                },
                {
                    model: USERS,
                    as: 'Respondent',
                    attributes: ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth']
                },
                {
                    model: USERS,
                    as: 'Handler',
                    attributes: ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth'],
                    required: false
                }
            ],
            order: [['CreatedAt', 'DESC']]
        });

        res.status(200).json({
            status: 200,
            message: 'Conversations retrieved successfully',
            data: disputes
        });

    } catch (error) {
        console.error('Error getting conversations:', error);
        res.status(500).json({
            status: 500,
            message: 'Error retrieving conversations'
        });
    }
});

// Get messages for a specific dispute/conversation
router.get('/conversation/:disputeId/messages', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const { disputeId } = req.params;
        const user = req.user;

        // Check if user has access to this conversation
        const dispute = await DISPUTE.findOne({
            where: {
                DisputeID: disputeId,
                [Op.or]: [
                    { LodgedBy: user.id },
                    { LodgedAgainst: user.id },
                    { HandledBy: user.id }
                ]
            }
        });

        if (!dispute) {
            return res.status(403).json({
                status: 403,
                message: 'Access denied to this conversation'
            });
        }

        // Get all messages for this dispute
        const messages = await DISPUTE_MSG.findAll({
            where: { DisputeID: disputeId },
            include: [
                {
                    model: USERS,
                    attributes: ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth']
                }
            ],
            order: [['MsgDate', 'ASC']]
        });

        // Mark messages as read for current user
        await DISPUTE_MSG.update(
            { IsRead: true },
            {
                where: {
                    DisputeID: disputeId,
                    SentBy: { [Op.ne]: user.id }
                }
            }
        );

        res.status(200).json({
            status: 200,
            message: 'Messages retrieved successfully',
            data: {
                dispute: dispute,
                messages: messages
            }
        });

    } catch (error) {
        console.error('Error getting messages:', error);
        res.status(500).json({
            status: 500,
            message: 'Error retrieving messages'
        });
    }
});

// Send message in a conversation
router.post('/conversation/:disputeId/send-message', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const { disputeId } = req.params;
        const { message, messageType = 'message' } = req.body;
        const user = req.user;

        if (!message || message.trim() === '') {
            return res.status(400).json({
                status: 400,
                message: 'Message content is required'
            });
        }

        // Check if user has access to this conversation
        const dispute = await DISPUTE.findOne({
            where: {
                DisputeID: disputeId,
                [Op.or]: [
                    { LodgedBy: user.id },
                    { LodgedAgainst: user.id },
                    { HandledBy: user.id }
                ]
            }
        });

        if (!dispute) {
            return res.status(403).json({
                status: 403,
                message: 'Access denied to this conversation'
            });
        }

        // Create new message
        const newMessage = await DISPUTE_MSG.create({
            DisputeID: disputeId,
            SentBy: user.id,
            Message: message.trim(),
            MessageType: messageType
        });

        // Update dispute status to "In Progress" if it was "Open"
        if (dispute.Status === 'Open') {
            dispute.Status = 'In Progress';
            await dispute.save();
        }

        // Get the message with user info
        const messageWithUser = await DISPUTE_MSG.findOne({
            where: { MessageID: newMessage.MessageID },
            include: [
                {
                    model: USERS,
                    attributes: ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth']
                }
            ]
        });

        res.status(200).json({
            status: 200,
            message: 'Message sent successfully',
            data: messageWithUser
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            status: 500,
            message: 'Error sending message'
        });
    }
});

// Admin: Assign dispute to admin/close dispute
router.patch('/conversation/:disputeId/manage', checkAuth(['Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const { disputeId } = req.params;
        const { action, status, handledBy, adminNote } = req.body;
        const user = req.user;

        const dispute = await DISPUTE.findOne({ where: { DisputeID: disputeId } });
        if (!dispute) {
            return res.status(404).json({
                status: 404,
                message: 'Dispute not found'
            });
        }

        // Update dispute based on action
        if (action === 'assign' && handledBy) {
            dispute.HandledBy = handledBy;
            dispute.Status = 'In Progress';
        } else if (action === 'resolve') {
            dispute.Status = 'Resolved';
            dispute.IsResolved = true;
            dispute.ResolvedAt = new Date();
        } else if (action === 'close') {
            dispute.Status = 'Closed';
            dispute.IsResolved = true;
            dispute.ResolvedAt = new Date();
        } else if (status) {
            dispute.Status = status;
        }

        await dispute.save();

        // Add admin note if provided
        if (adminNote) {
            await DISPUTE_MSG.create({
                DisputeID: disputeId,
                SentBy: user.id,
                Message: adminNote,
                MessageType: 'admin_note'
            });
        }

        res.status(200).json({
            status: 200,
            message: 'Dispute updated successfully',
            data: dispute
        });

    } catch (error) {
        console.error('Error managing dispute:', error);
        res.status(500).json({
            status: 500,
            message: 'Error managing dispute'
        });
    }
});

// Get unread message count for a user
router.get('/unread-count', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const user = req.user;

        // Get disputes where user is involved
        const userDisputes = await DISPUTE.findAll({
            where: {
                [Op.or]: [
                    { LodgedBy: user.id },
                    { LodgedAgainst: user.id },
                    { HandledBy: user.id }
                ]
            },
            attributes: ['DisputeID']
        });

        const disputeIds = userDisputes.map(d => d.DisputeID);

        // Count unread messages in these disputes (not sent by current user)
        const unreadCount = await DISPUTE_MSG.count({
            where: {
                DisputeID: { [Op.in]: disputeIds },
                SentBy: { [Op.ne]: user.id },
                IsRead: false
            }
        });

        res.status(200).json({
            status: 200,
            message: 'Unread count retrieved successfully',
            data: { unreadCount }
        });

    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({
            status: 500,
            message: 'Error retrieving unread count'
        });
    }
});

module.exports = router;