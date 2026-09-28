import { Controller, Get } from '@nestjs/common';
import { TiposPedidoService } from './tipos-pedido.service';

@Controller('tipos-pedido')
export class TiposPedidoController {
    constructor(private readonly tiposPedidoService: TiposPedidoService) { }

    @Get()
    listar() {
        return this.tiposPedidoService.listar();
    }
}