import { Test, TestingModule } from '@nestjs/testing';
import { MailingWorkerController } from './mailing-worker.controller';
import { MailingWorkerService } from './mailing-worker.service';

describe('MailingWorkerController', () => {
  let controller: MailingWorkerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MailingWorkerController],
      providers: [MailingWorkerService],
    }).compile();

    controller = module.get<MailingWorkerController>(MailingWorkerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
