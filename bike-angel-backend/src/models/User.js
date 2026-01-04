// User model
// Represents a user in the system

export class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.passwordHash = data.password_hash;
    this.name = data.name;
    this.emailVerified = data.email_verified;
    this.role = data.role || 'student';  // Add role field
    this.favoriteZones = data.favorite_zones || [];
    this.notificationsEnabled = data.notifications_enabled;
    this.createdAt = data.created_at;
  }

  /**
   * Convert to JSON representation (exclude sensitive data)
   */
  toJSON() {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      emailVerified: this.emailVerified,
      role: this.role,  // Include role in JSON output
      favoriteZones: this.favoriteZones,
      notificationsEnabled: this.notificationsEnabled,
      createdAt: this.createdAt
    };
  }
}
