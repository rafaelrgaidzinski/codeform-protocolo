import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { ListarPedidosQueryDto } from './dto/listar-pedidos.query';
import { TransicionarPedidoDto } from './dto/transicionar-pedido.dto';

@Injectable()
export class PedidosService {
    constructor(private readonly prisma: PrismaService) { }

    criar(dto: CriarPedidoDto) {
        throw new NotImplementedException('Implementado na etapa 3');
    }

    listar(query: ListarPedidosQueryDto) {
        throw new NotImplementedException('Implementado na etapa 5');
    }

    buscarPorId(id: string) {
        throw new NotImplementedException('Implementado na etapa 6');
    }

    transicionar(id: string, dto: TransicionarPedidoDto) {
        throw new NotImplementedException('Implementado na etapa 4');
    }
}