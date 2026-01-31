import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UseGuards } from "@nestjs/common";
// import { AuthService } from "../auth/auth.service"; // TODO: Re-enable with Supabase config
import {
  WebSocketEvent,
  SubscriptionChannel,
  WebSocketMessage,
  SubscribePayload,
  AuthenticatePayload,
  ClientMetadata,
  PriceUpdatePayload,
  CandleUpdatePayload,
  SignalPayload,
  AlertPayload,
} from "./websocket.types";

/**
 * WebSocket Gateway for Real-time Updates
 *
 * Provides real-time communication between backend and frontend
 * Supports:
 * - Price updates
 * - Candle updates
 * - Trading signals
 * - Alert notifications
 * - User-specific subscriptions
 */
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3001",
    credentials: true,
  },
  namespace: "/realtime",
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private clients: Map<string, ClientMetadata> = new Map();

  constructor(/* private readonly authService: AuthService */) {} // TODO: Re-enable with auth

  afterInit(server: Server) {
    this.logger.log("WebSocket Gateway initialized");
  }

  async handleConnection(client: Socket) {
    const clientId = client.id;
    this.logger.log(`Client connected: ${clientId}`);

    // Initialize client metadata
    this.clients.set(clientId, {
      userId: undefined,
      subscriptions: new Set(),
      authenticated: false,
      connectedAt: new Date(),
    });

    // Send connection confirmation
    this.sendMessage(client, {
      event: WebSocketEvent.CONNECT,
      data: {
        message: "Connected successfully",
        clientId,
      },
      timestamp: Date.now(),
    });
  }

  handleDisconnect(client: Socket) {
    const clientId = client.id;
    const metadata = this.clients.get(clientId);

    if (metadata) {
      this.logger.log(
        `Client disconnected: ${clientId} (userId: ${metadata.userId}, subscriptions: ${metadata.subscriptions.size})`,
      );
      this.clients.delete(clientId);
    }
  }

  /**
   * Authenticate client with JWT token
   */
  @SubscribeMessage(WebSocketEvent.AUTHENTICATE)
  async handleAuthenticate(
    @MessageBody() payload: AuthenticatePayload,
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // TODO: Re-enable with auth
      // const user = await this.authService.verifyToken(payload.token);
      const user = { id: "temp-user", email: "temp@example.com" }; // Temporary mock
      const metadata = this.clients.get(client.id);

      if (metadata) {
        metadata.userId = user.id;
        metadata.authenticated = true;
        this.clients.set(client.id, metadata);

        this.sendMessage(client, {
          event: WebSocketEvent.AUTHENTICATED,
          data: {
            userId: user.id,
            email: user.email,
          },
          timestamp: Date.now(),
        });

        this.logger.log(
          `Client authenticated: ${client.id} (user: ${user.email})`,
        );
      }
    } catch (error) {
      this.sendMessage(client, {
        event: WebSocketEvent.ERROR,
        data: {
          message: "Authentication failed",
          error: error.message,
        },
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Subscribe to a channel
   */
  @SubscribeMessage(WebSocketEvent.SUBSCRIBE)
  async handleSubscribe(
    @MessageBody() payload: SubscribePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const metadata = this.clients.get(client.id);
    if (!metadata) return;

    const { channel, symbols } = payload;

    // Create subscription key
    const subscriptionKey = symbols
      ? `${channel}:${symbols.join(",")}`
      : channel;

    metadata.subscriptions.add(subscriptionKey);

    // Join Socket.IO room
    client.join(subscriptionKey);

    this.sendMessage(client, {
      event: WebSocketEvent.SUBSCRIBED,
      channel,
      data: {
        channel,
        symbols,
        subscriptionKey,
      },
      timestamp: Date.now(),
    });

    this.logger.log(`Client ${client.id} subscribed to ${subscriptionKey}`);
  }

  /**
   * Unsubscribe from a channel
   */
  @SubscribeMessage(WebSocketEvent.UNSUBSCRIBE)
  async handleUnsubscribe(
    @MessageBody() payload: SubscribePayload,
    @ConnectedSocket() client: Socket,
  ) {
    const metadata = this.clients.get(client.id);
    if (!metadata) return;

    const { channel, symbols } = payload;

    const subscriptionKey = symbols
      ? `${channel}:${symbols.join(",")}`
      : channel;

    metadata.subscriptions.delete(subscriptionKey);

    // Leave Socket.IO room
    client.leave(subscriptionKey);

    this.sendMessage(client, {
      event: WebSocketEvent.UNSUBSCRIBED,
      channel,
      data: {
        channel,
        symbols,
        subscriptionKey,
      },
      timestamp: Date.now(),
    });

    this.logger.log(`Client ${client.id} unsubscribed from ${subscriptionKey}`);
  }

  /**
   * Broadcast price update to subscribers
   */
  broadcastPriceUpdate(payload: PriceUpdatePayload) {
    const channel = SubscriptionChannel.PRICES;
    const subscriptionKey = `${channel}:${payload.symbol}`;

    this.server.to(subscriptionKey).emit(WebSocketEvent.PRICE_UPDATE, {
      event: WebSocketEvent.PRICE_UPDATE,
      channel,
      data: payload,
      timestamp: Date.now(),
    } as WebSocketMessage<PriceUpdatePayload>);

    // Also broadcast to general prices channel
    this.server.to(channel).emit(WebSocketEvent.PRICE_UPDATE, {
      event: WebSocketEvent.PRICE_UPDATE,
      channel,
      data: payload,
      timestamp: Date.now(),
    } as WebSocketMessage<PriceUpdatePayload>);
  }

  /**
   * Broadcast candle update to subscribers
   */
  broadcastCandleUpdate(payload: CandleUpdatePayload) {
    const channel = SubscriptionChannel.CANDLES;
    const subscriptionKey = `${channel}:${payload.symbol}`;

    this.server.to(subscriptionKey).emit(WebSocketEvent.CANDLE_UPDATE, {
      event: WebSocketEvent.CANDLE_UPDATE,
      channel,
      data: payload,
      timestamp: Date.now(),
    } as WebSocketMessage<CandleUpdatePayload>);

    this.server.to(channel).emit(WebSocketEvent.CANDLE_UPDATE, {
      event: WebSocketEvent.CANDLE_UPDATE,
      channel,
      data: payload,
      timestamp: Date.now(),
    } as WebSocketMessage<CandleUpdatePayload>);
  }

  /**
   * Broadcast new signal to subscribers
   */
  broadcastSignal(payload: SignalPayload) {
    const channel = SubscriptionChannel.SIGNALS;
    const subscriptionKey = `${channel}:${payload.cryptoSymbol}`;

    this.server.to(subscriptionKey).emit(WebSocketEvent.SIGNAL_CREATED, {
      event: WebSocketEvent.SIGNAL_CREATED,
      channel,
      data: payload,
      timestamp: Date.now(),
    } as WebSocketMessage<SignalPayload>);

    this.server.to(channel).emit(WebSocketEvent.SIGNAL_CREATED, {
      event: WebSocketEvent.SIGNAL_CREATED,
      channel,
      data: payload,
      timestamp: Date.now(),
    } as WebSocketMessage<SignalPayload>);

    this.logger.log(
      `Broadcasted signal: ${payload.type} for ${payload.cryptoSymbol}`,
    );
  }

  /**
   * Send alert notification to specific user
   */
  sendAlertToUser(userId: string, payload: AlertPayload) {
    // Find all sockets for this user
    const userSockets = Array.from(this.clients.entries())
      .filter(([_, metadata]) => metadata.userId === userId)
      .map(([socketId, _]) => socketId);

    userSockets.forEach((socketId) => {
      this.server.to(socketId).emit(WebSocketEvent.ALERT_TRIGGERED, {
        event: WebSocketEvent.ALERT_TRIGGERED,
        channel: SubscriptionChannel.ALERTS,
        data: payload,
        timestamp: Date.now(),
      } as WebSocketMessage<AlertPayload>);
    });

    this.logger.log(`Sent alert to user ${userId}: ${payload.message}`);
  }

  /**
   * Broadcast alert to all users subscribed to alerts channel
   */
  broadcastAlert(payload: AlertPayload) {
    const channel = SubscriptionChannel.ALERTS;

    this.server.to(channel).emit(WebSocketEvent.ALERT_TRIGGERED, {
      event: WebSocketEvent.ALERT_TRIGGERED,
      channel,
      data: payload,
      timestamp: Date.now(),
    } as WebSocketMessage<AlertPayload>);
  }

  /**
   * Get connected clients count
   */
  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  /**
   * Get authenticated clients count
   */
  getAuthenticatedClientsCount(): number {
    return Array.from(this.clients.values()).filter((m) => m.authenticated)
      .length;
  }

  /**
   * Helper: Send message to specific client
   */
  private sendMessage(client: Socket, message: WebSocketMessage) {
    client.emit(message.event, message);
  }
}
