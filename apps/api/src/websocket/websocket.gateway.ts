import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from '../common/services/logger.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws',
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, { userId?: string; role?: string }> = new Map();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      
      if (token) {
        const payload = this.jwtService.verify(token as string, {
          secret: this.configService.get<string>('JWT_SECRET'),
        });
        
        this.connectedClients.set(client.id, {
          userId: payload.sub,
          role: payload.role,
        });

        // Join user-specific room
        client.join(`user:${payload.sub}`);
        
        // Join role-based room
        if (['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
          client.join('admins');
        }
      } else {
        this.connectedClients.set(client.id, {});
      }

      // Everyone joins public room for stock updates
      client.join('public');

      this.logger.debug(
        `Client connected: ${client.id}`,
        'WebsocketGateway',
      );
    } catch (error) {
      this.connectedClients.set(client.id, {});
      client.join('public');
    }
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.debug(`Client disconnected: ${client.id}`, 'WebsocketGateway');
  }

  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { token: string },
  ) {
    try {
      const payload = this.jwtService.verify(data.token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      this.connectedClients.set(client.id, {
        userId: payload.sub,
        role: payload.role,
      });

      client.join(`user:${payload.sub}`);
      
      if (['ADMIN', 'SUPER_ADMIN'].includes(payload.role)) {
        client.join('admins');
      }

      return { success: true, userId: payload.sub };
    } catch {
      return { success: false, error: 'Invalid token' };
    }
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    const clientInfo = this.connectedClients.get(client.id);
    
    // Validate subscription permissions
    if (data.channel === 'orders' || data.channel === 'admin') {
      if (!clientInfo?.role || !['ADMIN', 'SUPER_ADMIN'].includes(clientInfo.role)) {
        return { success: false, error: 'Unauthorized' };
      }
    }

    client.join(data.channel);
    return { success: true, channel: data.channel };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { channel: string },
  ) {
    client.leave(data.channel);
    return { success: true };
  }

  // Methods to emit events (called by services)
  emitStockUpdate(productId: string, data: any) {
    this.server.to('public').emit('stock:update', {
      type: 'STOCK_UPDATE',
      payload: data,
      timestamp: new Date().toISOString(),
    });
  }

  emitOrderStatusUpdate(userId: string, data: any) {
    this.server.to(`user:${userId}`).emit('order:status', {
      type: 'ORDER_STATUS_UPDATE',
      payload: data,
      timestamp: new Date().toISOString(),
    });
  }

  emitNewOrder(data: any) {
    this.server.to('admins').emit('order:new', {
      type: 'NEW_ORDER',
      payload: data,
      timestamp: new Date().toISOString(),
    });
  }

  emitProductUpdate(data: any) {
    this.server.to('public').emit('product:update', {
      type: 'PRODUCT_UPDATE',
      payload: data,
      timestamp: new Date().toISOString(),
    });
  }

  emitStoreStatusUpdate(data: any) {
    this.server.to('public').emit('store:status', {
      type: 'STORE_STATUS_UPDATE',
      payload: data,
      timestamp: new Date().toISOString(),
    });
  }
}
