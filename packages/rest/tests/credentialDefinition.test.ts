import type { Agent } from '@aries-framework/core'
import type { Express } from 'express'
import type { CredDef } from 'indy-sdk'

import request from 'supertest'

import { setupServer } from '../src/server'

import { getTestAgent, getTestCredDef } from './utils/helpers'

describe('CredentialDefinitionController', () => {
  let app: Express
  let agent: Agent
  let testCredDef: CredDef

  beforeAll(async () => {
    agent = await getTestAgent('Rest CredentialDefinition Test', 3007)
    app = await setupServer(agent)
    testCredDef = getTestCredDef()
  })

  describe('get credential definition by id', () => {
    test('should return credential definition ', async () => {
      const spy = jest.spyOn(agent.ledger, 'getCredentialDefinition').mockResolvedValueOnce(testCredDef)
      const getResult = (): Promise<CredDef> => spy.mock.results[0].value

      const response = await request(app).get(`/credential-defintions/WgWxqztrNooG92RXvxSTWv:3:CL:20:tag`)
      const result = await getResult()

      expect(response.statusCode).toBe(200)
      expect(response.body.id).toEqual(result.id)
      expect(response.body.schemaId).toEqual(result.schemaId)
      expect(response.body.tag).toEqual(result.tag)
      expect(response.body.type).toEqual(result.type)
      expect(response.body.ver).toEqual(result.ver)
    })

    test('should return 400 BadRequest when id has invalid structure', async () => {
      const response = await request(app).get(`/credential-defintions/x`)
      expect(response.statusCode).toBe(400)
    })

    test('should return 404 NotFound when schema not found', async () => {
      const response = await request(app).get(`/credential-defintions/WgWxqztrNooG92RXvxSTWv:3:CL:20:tag`)
      expect(response.statusCode).toBe(404)
    })
  })

  describe('create credential definition', () => {
    test('should return created credential definition ', async () => {
      const spy = jest.spyOn(agent.ledger, 'registerCredentialDefinition').mockResolvedValueOnce(testCredDef)

      jest.spyOn(agent.ledger, 'getSchema').mockResolvedValueOnce({
        id: 'WgWxqztrNooG92RXvxSTWv:2:schema_name:1.0',
        name: 'test',
        version: '1.0',
        ver: '1.0',
        seqNo: 9999,
        attrNames: ['prop1', 'prop2'],
      })

      const getResult = (): Promise<CredDef> => spy.mock.results[0].value

      const response = await request(app).post(`/credential-defintions`).send({
        tag: 'latest',
        supportRevocation: false,
        schemaId: 'WgWxqztrNooG92RXvxSTWv:2:schema_name:1.0',
      })

      const result = await getResult()

      expect(response.statusCode).toBe(200)
      expect(response.body.id).toEqual(result.id)
      expect(response.body.schemaId).toEqual(result.schemaId)
      expect(response.body.tag).toEqual(result.tag)
      expect(response.body.type).toEqual(result.type)
      expect(response.body.ver).toEqual(result.ver)
    })

    test('should throw error when props missing ', async () => {
      const response = await request(app).post(`/credential-defintions`).send({
        tag: 'latest',
        supportRevocation: false,
      })
      expect(response.statusCode).toBe(400)
    })
  })

  afterAll(async () => {
    await agent.shutdown({ deleteWallet: true })
  })
})
