// Updated updateProfile function with bike_name support

export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { name, bike_name, notifications_enabled } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      values.push(name);
      paramCount++;
    }

    if (bike_name !== undefined) {
      updates.push(`bike_name = $${paramCount}`);
      values.push(bike_name || null); // Allow clearing bike name
      paramCount++;
    }

    if (notifications_enabled !== undefined) {
      updates.push(`notifications_enabled = $${paramCount}`);
      values.push(notifications_enabled);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update',
        statusCode: 400
      });
    }

    // Add user ID as last parameter
    values.push(userId);

    const result = await pool.query(
      `UPDATE users
       SET ${updates.join(', ')}
       WHERE id = $${paramCount}
       RETURNING id, email, name, bike_name, email_verified, notifications_enabled, created_at`,
      values
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};
