/**
 * Data Model Interfaces
 */

import e = require('express');

import { User } from './../users/user.interface';
import { Registration } from './registration.interface';
import { Registrations } from './registrations.interface';
import { Http_Response } from './../http_responses/http_response.interface';

/**
 * In-Memory Store
 */

var dbPool = require('../../database/Database'); 

/**
 * Service Methods
 * Each method returns an 'Http_Response' object to {model}.router
 * 
 */

// GET registrations/

export const getAll = async (): Promise<Http_Response> => {

  let http_response: Http_Response = {
    status_code: null, 
    message: '',
    data: {}
  };

  let query: string = 'SELECT * FROM registrations';
  let rows: Object = await dbPool.query(query);
  let registrations: Registrations = JSON.parse(JSON.stringify(rows)); 

  if (Object.keys(registrations).length) {  
    http_response.status_code = 200;
    http_response.message = 'Successfully retrieved registrations.';
    http_response.data = registrations; 
    return http_response;  
  }

  http_response.status_code = 204; 
  http_response.message = 'No registrations found.';
  http_response.data = {}; 
  return http_response;  
};

// GET registrations/:id

export const find = async (id: number): Promise<Http_Response> => {

  let http_response: Http_Response = {
    status_code: null, 
    message: '',
    data: {}
  };

  let query: string = `SELECT * FROM registrations WHERE id=${id}`;
  let rows: Object = await dbPool.query(query);
  let registration: Registration = JSON.parse(JSON.stringify(rows))[0]; 

  if (registration == undefined) {
    http_response.status_code = 404;
    http_response.message = 'No registration found with the given id.';
    http_response.data = {'id': id}; 
    return http_response;  
  }

  http_response.status_code = 200;
  http_response.message = 'Successfully retrieved registration by id.';
  http_response.data = registration;
  return http_response;   
};

// POST registrations/

export const create = async (newRegistration: Registration): Promise<Http_Response> => {

  let http_response: Http_Response = {
    status_code: null, 
    message: '',
    data: {}
  };

  // if registration email already exists in 'users' table, add new registration
  // if it does not exist, generate new User in 'users' table and add new registration
  let email: string = newRegistration.registration_meta.email_address; 
  let selectUsersQuery: string = `SELECT * FROM users WHERE email_address='${email}'`;
  let row: Object = await dbPool.query(selectUsersQuery);
  let existingUser: User = JSON.parse(JSON.stringify(row)); 

  if (Object.keys(existingUser).length) {     
    newRegistration.user_id = existingUser[0].id;
    /*
      to do... 
      if ('user' table first_name + last_name !== registration first_name + last_name) {
        override existing user first_name last_name w/ most recent 
      }
    */   
  } else {

    let addNewUserQuery: string = ''; 
    let newUserPreQuery: string = 'INSERT INTO users';
    let newUserQueryKeys: string[] = [];
    let newUserPostQuery: string = 'VALUES(';

    let timestamp: string = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    let password: string = 'placeholder';

    // make flat new user object to build insert query 
    let mockNewUserObject: Object = {
      first_name: newRegistration.registration_meta.first_name,
      last_name: newRegistration.registration_meta.last_name,
      email_address: newRegistration.registration_meta.email_address,
      password: password,
      created_at: timestamp
    };

    // build users INSERT query
    let x: number = 0; 
    Object.keys(mockNewUserObject).forEach(function(key) {
      newUserQueryKeys.push(key); 
      newUserPostQuery = `${newUserPostQuery} '${mockNewUserObject[key]}'`;
      if (x < ((Object.keys(mockNewUserObject)).length - 1)) {
        newUserPostQuery = `${newUserPostQuery},`;
      } else {
        newUserPostQuery = `${newUserPostQuery})`;
      }
      x++; 
    });

    addNewUserQuery = `${newUserPreQuery}(${newUserQueryKeys}) ${newUserPostQuery}`;  
    let newUserResponse: Object = await dbPool.query(addNewUserQuery);  
    /*
     to do... catch errors here? 
    */

    // add foreign key from 'user' to newRegistration
    newRegistration.user_id = newUserResponse['insertId'];
  }

  let timestamp: string = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  newRegistration.created_at = timestamp; 

  // check if registration exist w/ same user_id + event_id 
  // if yes: update exisiting. if no: create
  let selectRegistrationQuery: string = `SELECT * FROM registrations WHERE user_id=${newRegistration.user_id} AND event_id=${newRegistration.event_id}`;
  let existingRegistrationResponse: Object = await dbPool.query(selectRegistrationQuery);

  if (Object.keys(existingRegistrationResponse).length) {  

    let timestamp: string = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
    newRegistration.updated_at = timestamp; 
  
    // build query 
    let updatedRegistrationQuery: string = ''; 
    let updateRegistrationPreQuery: string = 'UPDATE registrations SET';
    let updateRegistrationQueryKeys: string[] = [];
    let updatedRegistrationPostQuery: string = `WHERE user_id=${newRegistration.user_id} AND event_id=${newRegistration.event_id}`;
  
    Object.keys(newRegistration).forEach(function(key) {
      if (key === 'event_id' || key === 'user_id') {
        updateRegistrationQueryKeys.push(`${key}=${newRegistration[key]}`); 
      } else if (key === 'registration_meta') {
        updateRegistrationQueryKeys.push(`${key}='${JSON.stringify(newRegistration[key])}'`); 
      } else {
        updateRegistrationQueryKeys.push(`${key}='${newRegistration[key]}'`); 
      }
    });
  
    updatedRegistrationQuery = `${updateRegistrationPreQuery} ${updateRegistrationQueryKeys} ${updatedRegistrationPostQuery}`;
    let updatedRegistrationResponse: Object = await dbPool.query(updatedRegistrationQuery);   
    
    if (updatedRegistrationResponse['affectedRows'] === 1) {
      http_response.status_code = 200;
      http_response.message = 'Successfully updated existing registration.';
      http_response.data = newRegistration
      return http_response;
    } 
  
    http_response.status_code = 500;
    http_response.message = 'Unable to update existing registration.';
    http_response.data = newRegistration;  
    return http_response; 
  }

  // build new registration INSERT query
  let addNewRegQuery: string = ''; 
  let newRegPreQuery: string = 'INSERT INTO registrations';
  let newRegQueryKeys: string[] = [];
  let newRegPostQuery: string = 'VALUES(';

  let y: number = 0; 
  Object.keys(newRegistration).forEach(function(key) {
    newRegQueryKeys.push(key); 

    if (key === 'user_id' || key === 'event_id') {
      newRegPostQuery = `${newRegPostQuery} ${newRegistration[key]}`;
    } else if (key === 'registration_meta') {
      newRegPostQuery = `${newRegPostQuery} '${JSON.stringify(newRegistration[key])}'`;
    } else {
      newRegPostQuery = `${newRegPostQuery} '${newRegistration[key]}'`;
    }

    if (y < ((Object.keys(newRegistration)).length - 1)) {
      newRegPostQuery = `${newRegPostQuery},`;
    } else {
      newRegPostQuery = `${newRegPostQuery})`;
    }
    y++; 
  });

  addNewRegQuery = `${newRegPreQuery}(${newRegQueryKeys}) ${newRegPostQuery}`;  
  let newRegistrationResponse: Object = await dbPool.query(addNewRegQuery);  
  
  if (newRegistrationResponse['affectedRows'] === 1) {
    http_response.status_code = 201;
    http_response.message = `Successfully added new registration and corresponding 'users' table record.`;
    http_response.data = newRegistration; 
    return http_response; 
  } 

  http_response.status_code = 500;
  http_response.message = 'Unable to add new registration';
  http_response.data = newRegistration;  
  return http_response; 
};

// PUT registrations/

export const update = async (updatedRegistration: Registration): Promise<Http_Response> => {
  
  let http_response: Http_Response = {
    status_code: null, 
    message: '',
    data: {}
  };
  
  let registration_id: number = updatedRegistration.id; 
  if (registration_id == null) {
    http_response.status_code = 400;
    http_response.message = 'Missing id field.';
    http_response.data = {}; 
    return http_response;
  }  

  // check if valid registration id 
  let qy: string = `SELECT * FROM registrations WHERE id='${registration_id}'`;
  let rs: Object = await dbPool.query(qy);

  if (!Object.keys(rs).length) {  
    http_response.status_code = 404;
    http_response.message = 'Registration with this id does not exist.';
    http_response.data = {'id': registration_id};
    return http_response;
  };

  // add updated_at timestamp to updatedRegistration
  let timestamp: string = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  updatedRegistration.updated_at = timestamp;

  // build query 
  let query: string = ''; 
  let preQuery: string = 'UPDATE registrations SET';
  let queryKeys: string[] = [];
  let postQuery: string = `WHERE id=${registration_id}`;

  Object.keys(updatedRegistration).forEach(function(key) {
    queryKeys.push(`${key}='${updatedRegistration[key]}'`); 
  });

  query = `${preQuery} ${queryKeys} ${postQuery}`; 
  await dbPool.query(query);      

  http_response.status_code = 200;
  http_response.message = 'Successfully updated registration.';
  http_response.data = updatedRegistration
  return http_response;
};

// DELETE registrations/

export const remove = async (id: number): Promise<Http_Response> => {

  let http_response: Http_Response = {
    status_code: null, 
    message: '',
    data: {}
  };

  //  const record: User = users[id];

  let qy: string = `SELECT * FROM registrations`;
  let rs: Object = await dbPool.query(qy);
  if (!Object.keys(rs).length) {  
    // res.status(204)
    //   .send({
    //     message: 'There are no registrations to delete.',
    //     status: res.status
    //   });
  } else {
    let query = `DELETE FROM registrations`; 
    await dbPool.query(query);      
    // res.status(200)
    //   .send({
    //     message: 'Successfully deleted registration.',
    //     status: res.status,
    //     rs
    //   });
  }

  throw new Error('No record found to delete');
};