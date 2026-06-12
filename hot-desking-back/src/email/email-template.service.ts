import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';

@Injectable()
export class EmailTemplateService {
  private readonly templates = join(__dirname, 'templates');

  // Используем дженерик, чтобы линтер точно знал, что поле template существует
  public async render<T extends { template: string }>(
    data: T,
  ): Promise<string> {
    const filePath = join(this.templates, `${data.template}.hbs`);

    try {
      // Пытаемся прочитать файл
      const templateStr = await readFile(filePath, 'utf-8');
      const delegate = Handlebars.compile(templateStr);

      return delegate(data);
    } catch {
      // Если файла нет (ошибка ENOENT) или нет прав доступа, выбрасываем правильную ошибку
      throw new InternalServerErrorException(
        `Email template '${data.template}' not found`,
      );
    }
  }
}
