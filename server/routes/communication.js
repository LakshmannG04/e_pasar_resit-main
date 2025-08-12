// server/routes/communication.js - Enhanced Communication/Messaging System
const express = require('express');
const router = express.Router();
const { checkAuth } = require('../functions/checkAuth');
const { DISPUTE, DISPUTE_MSG, USERS } = require('../models');
const { Op } = require('sequelize');

// Create new dispute/communication thread
router.post('/create-dispute', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
    try {
        const { title, description, lodgedAgainst, priority = 'Medium' } = req.body;
        const user = req.user;

        if (!title || !description || !lodgedAgainst) {
            return res.status(400).json({
                status: 400,
                message: 'Title, description, and target user are required'
            });
        }

        // Check if target user exists
        const targetUser = await USERS.findOne({ where: { UserID: lodgedAgainst } });
        if (!targetUser) {
            return res.status(404).json({
                status: 404,
                message: 'Target user not found'
            });
        }

        // Create dispute
        const dispute = await DISPUTE.create({
            Title: title,
            Description: description,
            LodgedBy: user.id,
            LodgedAgainst: lodgedAgainst,
            Priority: priority,
            Status: 'Open'
        });

        // Add initial system message
        await DISPUTE_MSG.create({
            DisputeID: dispute.DisputeID,
            SentBy: user.id,
            Message: `Dispute created: ${description}`,
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

        // Admins can see all disputes they're handling
        if (user.userAuth === 'Admin' || user.userAuth === 'SuperAdmin') {
            whereClause = {
                [Op.or]: [
                    { LodgedBy: user.id },
                    { LodgedAgainst: user.id },
                    { HandledBy: user.id }
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