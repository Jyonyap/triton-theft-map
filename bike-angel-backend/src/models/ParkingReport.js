// ParkingReport model
// Represents a parking report submitted by a user

export class ParkingReport {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.zoneId = data.zone_id;
    this.photoUrl = data.photo_url;
    this.thumbnailUrl = data.thumbnail_url;
    this.timestamp = data.timestamp;
    this.expiresAt = data.expires_at;
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      zoneId: this.zoneId,
      photoUrl: this.photoUrl,
      thumbnailUrl: this.thumbnailUrl,
      timestamp: this.timestamp,
      expiresAt: this.expiresAt
    };
  }
}
