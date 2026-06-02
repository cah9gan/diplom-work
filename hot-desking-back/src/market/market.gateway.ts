import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MarketStreamMessageDTO } from './dto/market-stream.dto';

// Настраиваем Gateway. cors: true нужен, чтобы фронтенд с другого порта (3001) мог подключиться
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/market-stream', // Это "канал", к которому будет подключаться фронтенд
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // Это объект сервера, через который мы будем рассылать сообщения

  // Когда фронтенд подключается
  handleConnection(client: Socket) {
    console.log(`[MarketGateway] Клиент подключился: ${client.id}`);
  }

  // Когда фронтенд отключается
  handleDisconnect(client: Socket) {
    console.log(`[MarketGateway] Клиент отключился: ${client.id}`);
  }

  // Метод, который мы будем вызывать из MarketService, чтобы разослать свежую свечу всем!
  public broadcastMarketData(data: MarketStreamMessageDTO) {
    // Рассылаем событие с именем 'kline-update' всем, кто нас слушает
    this.server.emit('kline-update', data);
  }
}
