import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { join } from 'path';
import Handlebars from 'handlebars';
import { readFile } from 'fs/promises';

@Injectable()
export class EmailTemplateService {
  private readonly templates = join(__dirname, 'templates');

  // Використовуємо дженерик, щоб лінтер точно знав, що поле template існує
  public async render<T extends { template: string }>(
    data: T,
  ): Promise<string> {
    const filePath = join(this.templates, `${data.template}.hbs`);

    try {
      // Намагаємось прочитати файл шаблона
      const templateStr = await readFile(filePath, 'utf-8');
      const delegate = Handlebars.compile(templateStr);

      return delegate(data);
    } catch {
      // Якщо файла немає (помилка ENOENT) або немає прав доступу, викидаємо правильну помилку
      throw new InternalServerErrorException(
        `Email template '${data.template}' not found`,
      );
    }
  }
}
