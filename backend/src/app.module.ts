import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PedidosModule } from './pedidos/pedidos.module';
import { PrismaModule } from './prisma/prisma.module';
import { TiposPedidoModule } from './tipos-pedido/tipos-pedido.module';

@Module({
  imports: [PrismaModule, PedidosModule, TiposPedidoModule],
  controllers: [AppController],
})
export class AppModule { }