import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as classTransformer from 'class-transformer';
import * as classValidator from 'class-validator';

/**
 * Configurações globais da aplicação, em um único lugar.
 * Usado pelo main.ts (a aplicação real) e pelos testes de ponta a ponta,
 * para garantir que os testes rodem com exatamente a mesma configuração da produção.
 */
export function configurarApp(app: INestApplication): void {
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            validatorPackage: classValidator,
            transformerPackage: classTransformer,
        }),
    );

    app.enableCors({
        origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    });
}