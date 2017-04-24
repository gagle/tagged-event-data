import { expect } from 'chai';
import { Event } from '../../src';

export function assertDefaultTags(event: Event) {
  expect(event.tags).to.be.empty;
}

export function assertDefaultData(event: Event) {
  expect(event.data).to.be.an('object').and.to.be.empty;
}

export function assertDefaultMessage(event: Event) {
  expect(event.message).to.be.an('string').and.to.be.empty;
}

export function assertDefaultTimestamp(event: Event) {
  expect(event.timestamp).to.be.a('date');
  expect(event.timestamp.getTime() <= Date.now()).to.be.true;
}
