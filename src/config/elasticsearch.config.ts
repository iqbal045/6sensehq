import { Injectable } from '@nestjs/common';

@Injectable()
export class ElasticsearchConfig {
  public readonly node: string;

  constructor() {
    this.node = 'http://localhost:9200';
  }
}

export default new ElasticsearchConfig();
