import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TrackingService } from './tracking.service';
interface LocationData {
  driverId: number;
  deliveryId: number;
  latitude: number;
  longitude: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private connectedDrivers: Map<number, string> = new Map(); // driverId -> socketId

  constructor(private trackingService: TrackingService) {}

  handleConnection(client: Socket) {
    console.log('Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Client disconnected:', client.id);
    // Remove driver from tracking
    for (const [driverId, socketId] of this.connectedDrivers.entries()) {
      if (socketId === client.id) {
        this.connectedDrivers.delete(driverId);
      }
    }
  }

  // Driver sends location update
  @SubscribeMessage('updateLocation')
  async handleLocationUpdate(
    @MessageBody() data: LocationData,
    @ConnectedSocket() client: Socket,
  ) {
    const { driverId, deliveryId, latitude, longitude } = data;

    console.log(`Location update from driver ${driverId}:`, {
      deliveryId,
      latitude,
      longitude,
    });

    // Store location (in-memory + persist to DB)
    const location = await this.trackingService.updateDriverLocation(
      driverId,
      deliveryId,
      Number(latitude),
      Number(longitude),
    );

    // Register driver -> socket mapping
    this.connectedDrivers.set(driverId, client.id);

    // Broadcast to all connected clients
    // Emit global update
    this.server.emit('driverLocationUpdated', location);

    // Also emit to the specific delivery room (if clients joined)
    const room = `delivery-${deliveryId}`;
    this.server.to(room).emit('deliveryLocationUpdated', location);

    return { success: true };
  }

  // Admin/Company subscribes to delivery tracking
  @SubscribeMessage('watchDelivery')
  handleWatchDelivery(
    @MessageBody() data: { deliveryId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `delivery-${data.deliveryId}`;
    client.join(room);
    console.log(`Client ${client.id} joined room: ${room}`);
    return { success: true, room };
  }

  // Stop watching delivery
  @SubscribeMessage('unwatchDelivery')
  handleUnwatchDelivery(
    @MessageBody() data: { deliveryId: number },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `delivery-${data.deliveryId}`;
    client.leave(room);
    console.log(`Client ${client.id} left room: ${room}`);
    return { success: true };
  }

  // Broadcast location to specific delivery room
  notifyDeliveryLocationUpdate(
    deliveryId: number,
    locationData: any,
  ) {
    const room = `delivery-${deliveryId}`;
    this.server.to(room).emit('deliveryLocationUpdated', locationData);
  }

  // Broadcast to all connected clients
  notifyAllLocationUpdate(locationData: any) {
    this.server.emit('driverLocationUpdated', locationData);
  }
}