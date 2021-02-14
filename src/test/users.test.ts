import app from '../app';

const request = require('supertest');
var Utils = require('../utils/index'); 

/**
 * GET
 */
describe('GET api/v1/users', () => {
    
    test('responds with JSON object of users', async (done) => {
        
        const response = await request(app).get('/api/v1/users');
        
        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Successfully retrieved users.');
        expect(response.body instanceof Object).toBe(true);

        expect(response.body.data[0]).toMatchObject({
            id: expect.any(Number),
            email_address: expect.any(String),
            account_password: expect.any(String),
            first_name: expect.any(String),
            last_name: expect.any(String),
            created_at: expect.any(String),
            updated_at: expect.any(String),
            // anonymized_at: expect.any.toEqual(null)  
        });

        expect(Utils.validateEmailAddress(response.body.data[0].email_address)).toBe(true);
        
        done(); 
    });
});

/**
 * GET/:id
 */
describe('GET api/v1/users/:id', () => {

    test('responds with single JSON user object', async (done) => {
        
        const response = await request(app).get('/api/v1/users/1');
        
        expect(response.status).toBe(200);
        expect(response.body.message).toEqual('Successfully retrieved user by id.');
        expect(response.body instanceof Object).toBe(true);

        expect(response.body.data).toMatchObject({
            id: expect.any(Number),
            email_address: expect.any(String),
            account_password: expect.any(String),
            first_name: expect.any(String),
            last_name: expect.any(String),
            created_at: expect.any(String),
            updated_at: expect.any(String),
            // anonymized_at: expect.any.toEqual(null)  
        });

        expect(Utils.validateEmailAddress(response.body.data.email_address)).toBe(true);
        
        done(); 
    });
});

/**
 * POST
 */
describe('POST api/v1/users', () => {

    let timestamp = Utils.datetimeTimestamp(); 
    let testJSON: Object = {
        'email_address': `chaitest-${timestamp.replace(/ +/g, '-')}@testUsers.com`, 
        'first_name': 'test account', 
        'last_name': 'test account', 
        'account_password': 'test',
        'created_at': timestamp
        // 'id': generated by mysql 
    }; 

    test('responds with single JSON object', async (done) => {
        await request(app)
            .post('/api/v1/users')
            .send(testJSON)
            .expect(201)
            .then(async (response) => {
                expect(response.status).toBe(201);
                expect(response.body instanceof Object).toBe(true);
                expect(response.body.message).toEqual('Successfully added new user.');
            });
        
        done(); 
    });
});

/**
 * PUT
 */
describe('PUT api/v1/users', () => {

    let timestamp = Utils.datetimeTimestamp();  
    let testJSON: Object = {
        'id': 1,
        'account_password': `password-${timestamp.replace(/ +/g, '-')}`,
        'updated_at': timestamp
    }; 

    test('responds with JSON object', async (done) => { 
        await request(app)
        .put('/api/v1/users')
        .send(testJSON)
        .expect(200)
        .then(async (response) => {
            expect(response.status).toBe(200);
            expect(response.body instanceof Object).toBe(true);
            expect(response.body.message).toEqual('Successfully updated user.');
        });
                     
        done(); 
    });
});

/**
 * DELETE
 */

// to do... 
 