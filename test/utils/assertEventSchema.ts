import { expect } from 'chai';
import { Event } from '../../src';

export default function(event: Event): void {
  expect(event).to.have.all.keys('tags', 'data', 'message', 'timestamp');
  expect(event).to.have.property('tags')
    .that.is.an('array');
}
