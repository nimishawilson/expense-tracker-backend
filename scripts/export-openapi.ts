import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname } from 'path';
import { AppModule } from '../src/app.module';
import { swaggerConfig } from '../src/swagger.config';

// Builds the OpenAPI document without listening or connecting to the database
// (lifecycle hooks such as Prisma's $connect only run on init/listen).
async function exportOpenApi() {
  const out = process.argv[2] ?? 'docs/openapi.json';
  const app = await NestFactory.create(AppModule, { logger: false });
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(document, null, 2) + '\n');
  console.log(`OpenAPI spec written to ${out}`);
  process.exit(0);
}
void exportOpenApi();
