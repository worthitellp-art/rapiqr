const { Order, Sticker, ChatSession, ChatMessage, DistributorApplication, User } = require('../models/schemas');
const { logger } = require('../middleware/loggerMiddleware');

/**
 * Cascading account delete — unlinks the user from every collection that
 * references it, then removes the user document itself. Non-atomic (matches
 * the app's existing behavior everywhere else — no multi-document
 * transactions are used anywhere in this codebase). Shared by the
 * self-service "delete my account" flow and the admin "delete user" flow.
 */
async function deleteUserAccount(userId) {
  try {
    await Order.updateMany({ user_id: userId }, { $set: { user_id: null } });
  } catch (err) {
    logger.warn('ACCOUNT_DELETE', `Order unlink skipped for ${userId}: ${err.message}`);
  }

  try {
    const sessions = await ChatSession.find({ owner_id: userId }).select('_id').lean();
    const sessionIds = sessions.map((s) => s._id);
    if (sessionIds.length > 0) {
      await ChatMessage.deleteMany({ session_id: { $in: sessionIds } });
    }
    await ChatSession.deleteMany({ owner_id: userId });
  } catch (err) {
    logger.warn('ACCOUNT_DELETE', `Chat cleanup skipped for ${userId}: ${err.message}`);
  }

  try {
    await Sticker.updateMany({ user_id: userId }, { $set: { user_id: null, assigned_to: 'Unassigned' } });
  } catch (err) {
    logger.warn('ACCOUNT_DELETE', `Sticker unlink skipped for ${userId}: ${err.message}`);
  }

  try {
    await DistributorApplication.updateMany({ user_id: userId }, { $set: { user_id: null } });
  } catch (err) {
    logger.warn('ACCOUNT_DELETE', `Distributor application unlink skipped for ${userId}: ${err.message}`);
  }

  try {
    await User.findByIdAndDelete(userId);
  } catch (err) {
    logger.warn('ACCOUNT_DELETE', `User delete failed for ${userId}: ${err.message}`);
    throw err;
  }
}

module.exports = { deleteUserAccount };
