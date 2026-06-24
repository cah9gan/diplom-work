import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MarketStreamMessageDTO } from './dto/market-stream.dto';

// Налаштовуємо Gateway. cors: true потрібен, щоб фронтенд з іншого порту (3001) міг підключитися
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/market-stream', // Це "канал", до якого буде підключатися фронтенд
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server; // Це об'єкт сервера, через який ми будемо розсилати повідомлення

  // Коли фронтенд підключається
  handleConnection(client: Socket) {
    console.log(`[MarketGateway] Клієнт підключився: ${client.id}`);
  }

  // Когда фронтенд отключается
  handleDisconnect(client: Socket) {
    console.log(`[MarketGateway] Клієнт відключився: ${client.id}`);
  }

  // Метод, який ми будемо викликати з MarketService, щоб розіслати свіжу свічку всім!
  public broadcastMarketData(data: MarketStreamMessageDTO) {
    //  розсилаємо подію з ім'ям 'kline-update' всім, хто нас слухає
    this.server.emit('kline-update', data);
  }
}
