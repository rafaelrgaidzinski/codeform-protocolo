import type { Config } from 'jest';
import { pathsToModuleNameMapper } from 'ts-jest';
import ts from 'typescript';

// Path aliases (e.g. the ones added by `nest g library`) live in tsconfig.json,
// so they are read from there instead of being duplicated here.
const { config: tsconfig } = ts.readConfigFile(
  './tsconfig.json',
  ts.sys.readFile,
);
const paths = tsconfig?.compilerOptions?.paths ?? {};

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    // Nosso código TypeScript continua com o ts-jest (com checagem de tipos).
    '^.+\\.ts$': 'ts-jest',
    // Os pacotes do NestJS 12 vêm em ESM; o Babel os converte para CommonJS.
    '^.+\\.js$': 'babel-jest',
  },
  // Por padrão o Jest não processa o node_modules; abrimos exceção para o @nestjs.
  transformIgnorePatterns: ['/node_modules/(?!@nestjs/)'],
  moduleNameMapper: pathsToModuleNameMapper(paths, { prefix: '<rootDir>/' }),
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    'libs/**/*.(t|j)s',
    'apps/**/*.(t|j)s',
  ],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};

export default config;