import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CampusMap from '../CampusMap';

// Mock react-leaflet components
vi.mock('react-leaflet', () => ({
  MapContainer: ({ children, ...props }) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, eventHandlers, position }) => (
    <div 
      data-testid="marker" 
      data-position={JSON.stringify(position)}
      onClick={() => eventHandlers?.click?.()}
    >
      {children}
    </div>
  ),
  Popup: ({ children }) => <div data-testid="popup">{children}</div>,
  useMap: () => ({
    setView: vi.fn(),
  }),
}));

// Mock leaflet
vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        prototype: {},
        mergeOptions: vi.fn(),
      },
    },
    divIcon: vi.fn((options) => ({ options })),
  },
}));

describe('CampusMap - Map Interactions', () => {
  const mockZones = [
    {
      id: '1',
      name: 'Gilman Parking Structure',
      latitude: 32.8801,
      longitude: -117.2340,
      risk_rating: 'green',
      congestion_level: 'available',
    },
    {
      id: '2',
      name: 'Hopkins Parking Structure',
      latitude: 32.8820,
      longitude: -117.2350,
      risk_rating: 'yellow',
      congestion_level: 'filling',
    },
    {
      id: '3',
      name: 'Pangea Parking Lot',
      latitude: 32.8790,
      longitude: -117.2330,
      risk_rating: 'red',
      congestion_level: 'full',
    },
  ];

  const mockOnZoneClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render map container', () => {
    render(<CampusMap zones={[]} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('should render tile layer', () => {
    render(<CampusMap zones={[]} />);
    
    expect(screen.getByTestId('tile-layer')).toBeInTheDocument();
  });

  it('should render markers for all zones', () => {
    render(<CampusMap zones={mockZones} />);
    
    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(mockZones.length);
  });

  it('should render markers at correct positions', () => {
    render(<CampusMap zones={mockZones} />);
    
    const markers = screen.getAllByTestId('marker');
    
    markers.forEach((marker, index) => {
      const position = JSON.parse(marker.getAttribute('data-position'));
      expect(position).toEqual([mockZones[index].latitude, mockZones[index].longitude]);
    });
  });

  it('should call onZoneClick when marker is clicked', async () => {
    const user = userEvent.setup();
    render(<CampusMap zones={mockZones} onZoneClick={mockOnZoneClick} />);
    
    const markers = screen.getAllByTestId('marker');
    await user.click(markers[0]);
    
    expect(mockOnZoneClick).toHaveBeenCalledWith(mockZones[0]);
  });

  it('should display zone information in popup', () => {
    render(<CampusMap zones={mockZones} />);
    
    const popups = screen.getAllByTestId('popup');
    
    // Check first zone popup
    expect(popups[0]).toHaveTextContent('Gilman Parking Structure');
    expect(popups[0]).toHaveTextContent('green');
    expect(popups[0]).toHaveTextContent('available');
  });

  it('should render user location marker when provided', () => {
    const userLocation = [32.8800, -117.2340];
    render(<CampusMap zones={mockZones} userLocation={userLocation} />);
    
    const markers = screen.getAllByTestId('marker');
    // Should have zone markers + user location marker
    expect(markers.length).toBeGreaterThan(mockZones.length);
  });

  it('should center map on user location when provided', () => {
    const userLocation = [32.8800, -117.2340];
    const { container } = render(<CampusMap zones={mockZones} userLocation={userLocation} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should center map on custom center when provided', () => {
    const customCenter = [32.8850, -117.2360];
    render(<CampusMap zones={mockZones} center={customCenter} />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });

  it('should handle empty zones array', () => {
    render(<CampusMap zones={[]} />);
    
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.queryByTestId('marker')).not.toBeInTheDocument();
  });

  it('should display different risk ratings correctly', () => {
    render(<CampusMap zones={mockZones} />);
    
    const popups = screen.getAllByTestId('popup');
    
    expect(popups[0]).toHaveTextContent('green');
    expect(popups[1]).toHaveTextContent('yellow');
    expect(popups[2]).toHaveTextContent('red');
  });

  it('should display different congestion levels correctly', () => {
    render(<CampusMap zones={mockZones} />);
    
    const popups = screen.getAllByTestId('popup');
    
    expect(popups[0]).toHaveTextContent('available');
    expect(popups[1]).toHaveTextContent('filling');
    expect(popups[2]).toHaveTextContent('full');
  });

  it('should render View Details button in popup', () => {
    render(<CampusMap zones={mockZones} onZoneClick={mockOnZoneClick} />);
    
    const viewDetailsButtons = screen.getAllByText(/view details/i);
    expect(viewDetailsButtons).toHaveLength(mockZones.length);
  });

  it('should call onZoneClick when View Details is clicked', async () => {
    const user = userEvent.setup();
    render(<CampusMap zones={mockZones} onZoneClick={mockOnZoneClick} />);
    
    const viewDetailsButtons = screen.getAllByText(/view details/i);
    await user.click(viewDetailsButtons[0]);
    
    expect(mockOnZoneClick).toHaveBeenCalledWith(mockZones[0]);
  });
});
