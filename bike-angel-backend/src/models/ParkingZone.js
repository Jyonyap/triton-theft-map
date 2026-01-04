// ParkingZone model
// Represents a parking zone on campus

export class ParkingZone {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.coordinates = {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude)
    };
    this.capacity = data.capacity;
    this.riskRating = data.risk_rating;
    this.congestionLevel = data.congestion_level;
    this.lastUpdated = data.last_updated;
  }

  /**
   * Convert to JSON representation
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      coordinates: this.coordinates,
      capacity: this.capacity,
      riskRating: this.riskRating,
      congestionLevel: this.congestionLevel,
      lastUpdated: this.lastUpdated
    };
  }
}
