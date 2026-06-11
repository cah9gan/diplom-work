/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { Injectable, OnModuleInit } from '@nestjs/common';
import * as tf from '@tensorflow/tfjs';
import * as fs from 'fs';
import * as path from 'path';

export interface AiPredictionResult {
  trend: 'up' | 'down' | 'neutral';
  confidence: number;
  targetPrice: number;
}

// Описываем структуру JSON модели для линтера
interface ModelJsonConfig {
  modelTopology: any;
  weightsManifest: Array<{
    paths: string[];
    weights: tf.io.WeightsManifestEntry[];
  }>;
  format: string;
  generatedBy: string;
  convertedBy: string;
}

function localFileHandler(modelPath: string): tf.io.IOHandler {
  return {
    load: async () => {
      const modelJsonStr = await fs.promises.readFile(modelPath, 'utf8');
      // Теперь TypeScript знает структуру
      const modelJson: ModelJsonConfig = JSON.parse(modelJsonStr);

      try {
        const layers = modelJson.modelTopology?.model_config?.config?.layers;
        if (
          layers &&
          Array.isArray(layers) &&
          layers[0]?.class_name === 'InputLayer'
        ) {
          const config = layers[0].config;
          if (!config.batch_input_shape) {
            config.batch_input_shape = config.shape
              ? [null, ...config.shape]
              : [null, 60, 1];
          }
        }
      } catch (error) {
        console.warn('[AI] Не удалось проверить структуру InputLayer:', error);
      }

      // 👇 ИСПРАВЛЕННЫЙ ПАТЧ С REGEX 👇
      // Теперь он отрезает 'sequential/', 'sequential_1/', 'sequential_4/' и т.д.
      const weightSpecs = modelJson.weightsManifest[0].weights;
      weightSpecs.forEach((w) => {
        w.name = w.name.replace(/^sequential(?:_\d+)?\//, '');
      });

      const weightFileName = modelJson.weightsManifest[0].paths[0];
      const weightPath = path.join(path.dirname(modelPath), weightFileName);
      const weightBuffer = await fs.promises.readFile(weightPath);

      return {
        modelTopology: modelJson.modelTopology,
        weightSpecs: weightSpecs,
        weightData: new Uint8Array(weightBuffer).buffer,
        format: modelJson.format,
        generatedBy: modelJson.generatedBy,
        convertedBy: modelJson.convertedBy,
      };
    },
  };
}

@Injectable()
export class PredictService implements OnModuleInit {
  // ТЕПЕРЬ ХРАНИМ МОДЕЛИ В СЛОВАРЕ
  private models = new Map<string, tf.LayersModel>();
  private scalers = new Map<string, { min: number; max: number }>();

  private readonly SEQUENCE_LENGTH = 60;
  // Список таймфреймов, для которых у нас есть обученные модели
  private readonly SUPPORTED_INTERVALS = ['15m', '1h', '1d'];

  async onModuleInit() {
    // При старте сервера загружаем сразу все модели
    for (const interval of this.SUPPORTED_INTERVALS) {
      await this.loadModelForInterval(interval);
    }
  }

  private async loadModelForInterval(interval: string) {
    try {
      // Ищем папку по паттерну 'lstm_15m', 'lstm_1h' и т.д.
      const modelDir = path.join(
        process.cwd(),
        'src',
        'ai',
        'models',
        `lstm_${interval}`,
      );
      const modelPath = path.join(modelDir, 'model.json');
      const scalerPath = path.join(modelDir, 'scaler.json');

      // Если папки еще нет, просто пропускаем этот интервал
      if (!fs.existsSync(modelPath) || !fs.existsSync(scalerPath)) {
        console.log(
          `[AI-Ensemble] Модель для интервала ${interval} не найдена (пропуск)`,
        );
        return;
      }

      const scalerData = await fs.promises.readFile(scalerPath, 'utf8');
      const parsedScaler = JSON.parse(scalerData) as {
        min: number;
        max: number;
      };
      const loadedModel = await tf.loadLayersModel(localFileHandler(modelPath));

      this.models.set(interval, loadedModel);
      this.scalers.set(interval, parsedScaler);

      console.log(
        `[AI-Ensemble] Модель для интервала ${interval} успешно загружена!`,
      );
    } catch (error) {
      console.error(`[AI-Ensemble] Ошибка загрузки модели ${interval}:`, error);
    }
  }

  public predictLstm(
    prices: number[],
    currentPrice: number,
    interval: string, // ТЕПЕРЬ ПРИНИМАЕМ ИНТЕРВАЛ
  ): Promise<AiPredictionResult | null> {
    // Достаем нужную модель из словаря
    const model = this.models.get(interval);
    const scaler = this.scalers.get(interval);

    // Если для этого таймфрейма нет модели (например, '1m') — просто не даем прогноз
    if (!model || !scaler || prices.length < 2) {
      return Promise.resolve(null);
    }

    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      const pctChange = (prices[i] - prices[i - 1]) / prices[i - 1];
      returns.push(pctChange);
    }

    while (returns.length < this.SEQUENCE_LENGTH) {
      returns.unshift(returns[0] || 0);
    }
    const finalReturns = returns.slice(-this.SEQUENCE_LENGTH);

    const scaled = finalReturns.map(
      (r) => (r - scaler.min) / (scaler.max - scaler.min),
    );

    const result = tf.tidy(() => {
      const tensor = tf.tensor3d([scaled.map((r) => [r])]);
      const prediction = model.predict(tensor) as tf.Tensor;
      const value = prediction.dataSync()[0];

      const predictedReturn = value * (scaler.max - scaler.min) + scaler.min;
      const targetPrice = currentPrice * (1 + predictedReturn);

      let trend: 'up' | 'down' | 'neutral' = 'neutral';
      if (predictedReturn > 0.001) trend = 'up';
      if (predictedReturn < -0.001) trend = 'down';

      let confidence = 50 + Math.abs(predictedReturn * 100) * 15;
      if (trend === 'neutral') confidence = 50;
      if (confidence > 99) confidence = 99;

      console.log('-----------------------------------');
      console.log(`[AI Debug] Интервал:`, interval);
      console.log(`[AI Debug] Входящая цена монеты:`, currentPrice);
      console.log(`[AI Debug] Нейросеть выдала (сырое значение):`, value);
      console.log(
        `[AI Debug] Предсказанный % изменения:`,
        (predictedReturn * 100).toFixed(4) + '%',
      );
      console.log('-----------------------------------');

      return {
        trend,
        confidence: Math.round(confidence),
        targetPrice: targetPrice,
      };
    });

    return Promise.resolve(result);
  }
}
