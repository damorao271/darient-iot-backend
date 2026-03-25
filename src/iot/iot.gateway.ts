import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class IotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(IotGateway.name);

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.debug(`WS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`WS client disconnected: ${client.id}`);
  }

  emitTelemetry(spaceId: string, data: unknown) {
    this.server.emit('telemetry', { spaceId, data });
  }

  emitAlertOpened(spaceId: string, alert: unknown) {
    this.server.emit('alert:opened', { spaceId, alert });
  }

  emitAlertResolved(spaceId: string, alert: unknown) {
    this.server.emit('alert:resolved', { spaceId, alert });
  }

  emitReported(spaceId: string, reported: unknown) {
    this.server.emit('reported', { spaceId, reported });
  }
}
