import { Test, TestingModule } from '@nestjs/testing';
import { MailingWorkerService } from './mailing-worker.service';

describe('MailingWorkerService', () => {
  let service: MailingWorkerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MailingWorkerService],
    }).compile();

    service = module.get<MailingWorkerService>(MailingWorkerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
