'use server';

import {
  complianceSchema,
  messageSchema,
  offerSchema,
  serviceRequestSchema,
  serviceStatusSchema,
  sourcingSchema,
  sourcingStageSchema,
} from '@/lib/validation';
import { formFiles, formObject, runAction, type ActionResult } from '@/server/action';
import { requireUser } from '@/server/auth/session';
import { AppError } from '@/server/errors';
import * as files from '@/server/services/files';
import * as readiness from '@/server/services/readiness';
import * as sourcing from '@/server/services/sourcing';

/* Server actions for the sourcing desk, export readiness checklist and services. */

const DASH = ['/dashboard'];
const id = (v: unknown) => {
  const n = Number(v);
  if (!Number.isInteger(n) || n <= 0) throw new AppError('Missing reference');
  return n;
};

export async function createSourcingRequest(_prev: ActionResult<number> | null, fd: FormData): Promise<ActionResult<number>> {
  return runAction(
    async () => {
      const me = await requireUser('buyer');
      const reqId = await sourcing.createRequest(me, sourcingSchema.parse(formObject(fd)));
      const refs = formFiles(fd, 'refs').slice(0, 10);
      if (refs.length) await files.uploadFiles(me, { kind: 'sourcing', refId: reqId, label: 'Reference' }, refs);
      return reqId;
    },
    { revalidate: DASH, message: 'Request sent — our sourcing desk is matching manufacturers' },
  );
}

export async function submitOffer(requestId: number, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(async () => sourcing.submitOffer(await requireUser('vendor'), id(requestId), offerSchema.parse(formObject(fd))), {
    revalidate: DASH,
    message: 'Offer sent to the buyer',
  });
}

export async function requestSamples(offerId: number): Promise<ActionResult> {
  return runAction(async () => sourcing.requestSamples(await requireUser('buyer'), id(offerId)), {
    revalidate: DASH,
    message: 'Samples requested — we will confirm courier details',
  });
}

export async function placeSourcingOrder(offerId: number): Promise<ActionResult<string>> {
  return runAction(async () => sourcing.placeOrder(await requireUser('buyer'), id(offerId)), { revalidate: DASH });
}

export async function closeSourcingRequest(requestId: number): Promise<ActionResult> {
  return runAction(async () => sourcing.closeRequest(await requireUser('buyer', 'admin'), id(requestId)), {
    revalidate: DASH,
    message: 'Request closed',
  });
}

export async function setSourcingStage(requestId: number, stage: string): Promise<ActionResult> {
  return runAction(async () => sourcing.setStage(await requireUser('admin'), id(requestId), sourcingStageSchema.parse(stage)), {
    revalidate: DASH,
    message: 'Stage updated',
  });
}

export async function postSourcingMessage(requestId: number, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(
    async () => sourcing.addMessage(await requireUser('buyer', 'admin'), id(requestId), messageSchema.parse(formObject(fd)).body),
    { revalidate: DASH },
  );
}

export async function updateChecklistItem(key: string, _prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(async () => readiness.updateChecklistItem(await requireUser('vendor'), key, complianceSchema.parse(formObject(fd))), {
    revalidate: DASH,
    message: 'Checklist updated',
  });
}

export async function requestService(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  return runAction(
    async () => readiness.createServiceRequest(await requireUser('buyer', 'vendor'), serviceRequestSchema.parse(formObject(fd))),
    { revalidate: DASH, message: 'Request received — the Himbridge team will contact you within one working day' },
  );
}

export async function setServiceStatus(requestId: number, status: string): Promise<ActionResult> {
  return runAction(async () => readiness.setServiceStatus(await requireUser('admin'), id(requestId), serviceStatusSchema.parse(status)), {
    revalidate: DASH,
    message: 'Status updated',
  });
}
