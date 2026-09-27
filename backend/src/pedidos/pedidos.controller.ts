import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
} from '@nestjs/common';
import { CriarPedidoDto } from './dto/criar-pedido.dto';
import { ListarPedidosQueryDto } from './dto/listar-pedidos.query';
import { TransicionarPedidoDto } from './dto/transicionar-pedido.dto';
import { PedidosService } from './pedidos.service';

@Controller('pedidos')
export class PedidosController {
    constructor(private readonly pedidosService: PedidosService) { }

    @Post()
    criar(@Body() dto: CriarPedidoDto) {
        return this.pedidosService.criar(dto);
    }

    @Get()
    listar(@Query() query: ListarPedidosQueryDto) {
        return this.pedidosService.listar(query);
    }

    @Get(':id')
    buscarPorId(@Param('id', ParseUUIDPipe) id: string) {
        return this.pedidosService.buscarPorId(id);
    }

    @Post(':id/transicoes')
    @HttpCode(HttpStatus.OK)
    transicionar(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: TransicionarPedidoDto,
    ) {
        return this.pedidosService.transicionar(id, dto);
    }
}