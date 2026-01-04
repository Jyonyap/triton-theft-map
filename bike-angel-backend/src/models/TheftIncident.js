// TheftIncident model
// Represents a theft incident reported by a user

export class TheftIncident {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.zoneId = data.zone_id;
    this.dateTime = data.date_time;
    this.description = data.description;
    this.policeReportNumber = data.police_report_number;
    this.verified = data.verified;
    this.createdAt = data.created_at;
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      zoneId: this.zoneId,
      dateTime: this.dateTime,
      description: this.description,
      policeReportNumber: this.policeReportNumber,
      verified: this.verified,
      createdAt: this.createdAt
    };
  }
}
