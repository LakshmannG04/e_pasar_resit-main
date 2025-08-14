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

        // Enhanced Communication rules: 
        // - Buyers can contact Sellers only (not Admins directly)
        // - Sellers can contact Buyers AND Admins (for disputes and support)
        // - Admins can contact anyone
        if (currentUser.userAuth === 'User') {
            // Buyers can only search for Sellers (not Admins)
            searchConditions.UserAuth = {
                [Op.in]: ['Seller']
            };
            console.log(`🔍 Buyer search by ${currentUser.username} - can find Sellers only`);
        } else if (currentUser.userAuth === 'Seller') {
            // Sellers can search for Buyers AND Admins (for disputes and support)
            searchConditions.UserAuth = {
                [Op.in]: ['User', 'Admin', 'SuperAdmin']
            };
            console.log(`🔍 Seller search by ${currentUser.username} - can find Buyers and Admins`);
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
        const { title, description, lodgedAgainst, targetUsername } = req.body;
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

        // Create dispute (removed priority)
        const dispute = await DISPUTE.create({
            Title: title,
            Description: description,
            LodgedBy: user.id,
            LodgedAgainst: targetUser.UserID,
            Priority: 'Medium', // Default value to maintain database compatibility
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

        // UPDATED ADMIN ACCESS: Admins see both regular conversations AND assigned report conversations
        if (user.userAuth === 'Admin' || user.userAuth === 'SuperAdmin') {
            // Get report IDs where this admin is assigned
            const assignedReports = await REPORT.findAll({
                where: { AssignedAdminID: user.id },
                attributes: ['AdminConversationID']
            });

            const adminConversationIds = assignedReports.map(report => report.AdminConversationID).filter(id => id !== null);
            
            whereClause = {
                [Op.or]: [
                    { LodgedBy: user.id },           // Conversations admin started
                    { LodgedAgainst: user.id },      // Conversations directed to admin (seller contacting admin)
                    { HandledBy: user.id },          // Conversations admin is handling
                    { DisputeID: { [Op.in]: adminConversationIds } } // Assigned report conversations
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

// NEW ENHANCED COMMUNICATION SYSTEM ENDPOINTS

// Report a conversation
router.post('/report-conversation', checkAuth(['User', 'Seller']), uploadReportAttachments.array('attachments', 5), async (req, res) => {
    try {
        const user = req.user;
        const { conversationId, title, description, priority = 'Medium' } = req.body;

        if (!conversationId || !description) {
            return res.status(400).json({
                status: 400,
                message: 'Conversation ID and description are required'
            });
        }

        // Verify the conversation exists and user is part of it
        const conversation = await DISPUTE.findOne({
            where: {
                DisputeID: conversationId,
                [Op.or]: [
                    { LodgedBy: user.id },
                    { LodgedAgainst: user.id }
                ]
            }
        });

        if (!conversation) {
            return res.status(404).json({
                status: 404,
                message: 'Conversation not found or you are not authorized to report it'
            });
        }

        // Assign admin to handle this report
        const assignedAdmin = await assignAdminToReport();
        if (!assignedAdmin) {
            return res.status(500).json({
                status: 500,
                message: 'No available admins to handle this report'
            });
        }

        // Process attachments
        let attachmentPaths = [];
        if (req.files && req.files.length > 0) {
            attachmentPaths = req.files.map(file => file.filename);
        }

        // Create the report
        const report = await REPORT.create({
            ReportedConversationID: conversationId,
            ReportedBy: user.id,
            AssignedAdminID: assignedAdmin.UserID,
            ReportTitle: title || 'Conversation Report',
            ReportDescription: description,
            ReportAttachments: JSON.stringify(attachmentPaths),
            Priority: priority
        });

        // Create admin conversation with the reporter
        const adminConversation = await DISPUTE.create({
            Title: `Report: ${title || 'Conversation Issue'}`,
            Description: `Report submitted for conversation #${conversationId}`,
            LodgedBy: user.id,
            LodgedAgainst: assignedAdmin.UserID,
            Priority: priority,
            Status: 'Open'
        });

        // Update report with admin conversation ID
        report.AdminConversationID = adminConversation.DisputeID;
        await report.save();

        // Create initial message in admin conversation with report details
        const reportMessage = `**CONVERSATION REPORT**\n\n` +
            `**Original Conversation ID:** ${conversationId}\n` +
            `**Report Title:** ${title || 'Conversation Issue'}\n` +
            `**Description:** ${description}\n` +
            `**Priority:** ${priority}\n` +
            `**Attachments:** ${attachmentPaths.length} file(s)\n\n` +
            `This report has been automatically created. Please review the reported conversation and take appropriate action.`;

        await DISPUTE_MSG.create({
            DisputeID: adminConversation.DisputeID,
            SentBy: user.id,
            Message: reportMessage,
            MessageType: 'system'
        });

        res.status(200).json({
            status: 200,
            message: `Report submitted successfully. You have been connected with admin ${assignedAdmin.Username} to discuss this issue.`,
            data: {
                report: report,
                adminConversation: adminConversation,
                assignedAdmin: {
                    id: assignedAdmin.UserID,
                    username: assignedAdmin.Username
                }
            }
        });

    } catch (error) {
        console.error('Error reporting conversation:', error);
        res.status(500).json({
            status: 500,
            message: 'Error submitting report'
        });
    }
});

// Contact admin (for sellers)
router.post('/contact-admin', checkAuth(['Seller']), async (req, res) => {
    try {
        const user = req.user;
        const { subject = 'General Inquiry', message } = req.body;

        if (!message) {
            return res.status(400).json({
                status: 400,
                message: 'Message is required'
            });
        }

        // Assign a random admin
        const assignedAdmin = await assignAdminToReport();
        if (!assignedAdmin) {
            return res.status(500).json({
                status: 500,
                message: 'No available admins at the moment'
            });
        }

        // Create conversation with admin
        const adminConversation = await DISPUTE.create({
            Title: `Seller Inquiry: ${subject}`,
            Description: `Seller inquiry from ${user.username}`,
            LodgedBy: user.id,
            LodgedAgainst: assignedAdmin.UserID,
            Priority: 'Low',
            Status: 'Open'
        });

        // Add the seller's message
        await DISPUTE_MSG.create({
            DisputeID: adminConversation.DisputeID,
            SentBy: user.id,
            Message: message,
            MessageType: 'message'
        });

        res.status(200).json({
            status: 200,
            message: `Connected with admin ${assignedAdmin.Username}. Your inquiry has been sent.`,
            data: {
                conversationId: adminConversation.DisputeID,
                assignedAdmin: {
                    id: assignedAdmin.UserID,
                    username: assignedAdmin.Username,
                    name: `${assignedAdmin.FirstName} ${assignedAdmin.LastName}`
                }
            }
        });

    } catch (error) {
        console.error('Error contacting admin:', error);
        res.status(500).json({
            status: 500,
            message: 'Error contacting admin'
        });
    }
});

// Direct contact seller (for buyers) - streamlined approach
router.post('/contact-seller', checkAuth(['User']), async (req, res) => {
    try {
        const user = req.user;
        const { sellerId, productId, initialMessage } = req.body;

        if (!sellerId) {
            return res.status(400).json({
                status: 400,
                message: 'Seller ID is required'
            });
        }

        // Verify seller exists
        const seller = await USERS.findOne({
            where: { 
                UserID: sellerId,
                UserAuth: 'Seller'
            }
        });

        if (!seller) {
            return res.status(404).json({
                status: 404,
                message: 'Seller not found'
            });
        }

        // Check if conversation already exists
        const existingConversation = await DISPUTE.findOne({
            where: {
                [Op.or]: [
                    { LodgedBy: user.id, LodgedAgainst: sellerId },
                    { LodgedBy: sellerId, LodgedAgainst: user.id }
                ]
            }
        });

        if (existingConversation) {
            // If initial message provided, add it to existing conversation
            if (initialMessage) {
                await DISPUTE_MSG.create({
                    DisputeID: existingConversation.DisputeID,
                    SentBy: user.id,
                    Message: initialMessage,
                    MessageType: 'message'
                });
            }

            return res.status(200).json({
                status: 200,
                message: 'Redirected to existing conversation',
                data: {
                    conversationId: existingConversation.DisputeID,
                    isNewConversation: false
                }
            });
        }

        // Create new conversation
        const conversation = await DISPUTE.create({
            Title: productId ? `Product Inquiry - Product #${productId}` : 'General Inquiry',
            Description: `Buyer inquiry from ${user.username}`,
            LodgedBy: user.id,
            LodgedAgainst: sellerId,
            Priority: 'Low',
            Status: 'Open'
        });

        // Add initial message if provided
        if (initialMessage) {
            await DISPUTE_MSG.create({
                DisputeID: conversation.DisputeID,
                SentBy: user.id,
                Message: initialMessage,
                MessageType: 'message'
            });
        } else {
            // Add system message
            await DISPUTE_MSG.create({
                DisputeID: conversation.DisputeID,
                SentBy: user.id,
                Message: `Conversation started with ${seller.FirstName} ${seller.LastName} (@${seller.Username})`,
                MessageType: 'system'
            });
        }

        res.status(200).json({
            status: 200,
            message: 'Conversation started with seller',
            data: {
                conversationId: conversation.DisputeID,
                isNewConversation: true,
                seller: {
                    id: seller.UserID,
                    username: seller.Username,
                    name: `${seller.FirstName} ${seller.LastName}`
                }
            }
        });

    } catch (error) {
        console.error('Error contacting seller:', error);
        res.status(500).json({
            status: 500,
            message: 'Error starting conversation'
        });
    }
});

// Get report attachments
router.get('/report-attachment/:filename', checkAuth(['Admin', 'SuperAdmin']), (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(reportAttachmentsPath, filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                status: 404,
                message: 'Attachment not found'
            });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('Error serving attachment:', error);
        res.status(500).json({
            status: 500,
            message: 'Error retrieving attachment'
        });
    }
});

// Get admin workload (for debugging/monitoring)
router.get('/admin-workload', checkAuth(['SuperAdmin']), async (req, res) => {
    try {
        const admins = await USERS.findAll({
            where: {
                UserAuth: { [Op.in]: ['Admin', 'SuperAdmin'] }
            },
            attributes: ['UserID', 'Username', 'FirstName', 'LastName']
        });

        const workloadData = await Promise.all(
            admins.map(async (admin) => {
                const reportCount = await REPORT.count({
                    where: {
                        AssignedAdminID: admin.UserID,
                        Status: { [Op.in]: ['Pending', 'Under Review'] }
                    }
                });

                return {
                    admin: admin,
                    activeReports: reportCount
                };
            })
        );

        res.status(200).json({
            status: 200,
            message: 'Admin workload retrieved successfully',
            data: workloadData
        });

    } catch (error) {
        console.error('Error getting admin workload:', error);
        res.status(500).json({
            status: 500,
            message: 'Error retrieving admin workload'
        });
    }
});

module.exports = router;