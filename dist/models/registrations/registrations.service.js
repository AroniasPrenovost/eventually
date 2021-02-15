"use strict";
/**
 * Data Model Interfaces
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.remove = exports.update = exports.create = exports.find = exports.getAll = void 0;
var Utils = require('../../utils/index');
/**
 * In-Memory Store
 */
var dbPool = require('../../database/database');
/**
 * Service Methods
 * Each method returns an 'HttpResponse' object to {model}.router
 *
 */
// GET registrations/
exports.getAll = () => __awaiter(void 0, void 0, void 0, function* () {
    let httpResponse = {
        status_code: null,
        message: '',
        data: {}
    };
    let query = 'SELECT * FROM registrations';
    let rows = yield dbPool.query(query);
    let registrations = JSON.parse(JSON.stringify(rows));
    if (Object.keys(registrations).length) {
        httpResponse.status_code = 200;
        httpResponse.message = 'Successfully retrieved registrations.';
        httpResponse.data = registrations;
        return httpResponse;
    }
    httpResponse.status_code = 204;
    httpResponse.message = 'No registrations found.';
    httpResponse.data = {};
    return httpResponse;
});
// GET registrations/:id
exports.find = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let httpResponse = {
        status_code: null,
        message: '',
        data: {}
    };
    let query = `SELECT * FROM registrations WHERE id=${id}`;
    let rows = yield dbPool.query(query);
    let registration = JSON.parse(JSON.stringify(rows))[0];
    if (registration == undefined) {
        httpResponse.status_code = 404;
        httpResponse.message = 'No registration found with the given id.';
        httpResponse.data = { 'id': id };
        return httpResponse;
    }
    httpResponse.status_code = 200;
    httpResponse.message = 'Successfully retrieved registration by id.';
    httpResponse.data = registration;
    return httpResponse;
});
// POST registrations/
exports.create = (newRegistration) => __awaiter(void 0, void 0, void 0, function* () {
    let httpResponse = {
        status_code: null,
        message: '',
        data: {}
    };
    // if registration email already exists in 'users' table, add new registration
    // if it does not exist, generate new User in 'users' table and add new registration
    let email = newRegistration.registration_meta.email_address;
    let selectUsersQuery = `SELECT * FROM users WHERE email_address='${email}'`;
    let row = yield dbPool.query(selectUsersQuery);
    let existingUser = JSON.parse(JSON.stringify(row));
    if (Object.keys(existingUser).length) {
        newRegistration.user_id = existingUser[0].id;
        /*
          to do...
          if ('user' table first_name + last_name !== registration first_name + last_name) {
            override existing user first_name last_name w/ most recent
          }
        */
    }
    else {
        let addNewUserQuery = '';
        let newUserPreQuery = 'INSERT INTO users';
        let newUserQueryKeys = [];
        let newUserPostQuery = 'VALUES(';
        let password = 'placeholder';
        // make flat new user object to build insert query 
        let mockNewUserObject = {
            first_name: newRegistration.registration_meta.first_name,
            last_name: newRegistration.registration_meta.last_name,
            email_address: newRegistration.registration_meta.email_address,
            account_password: password,
            created_at: Utils.datetimeTimestamp()
        };
        // build users INSERT query
        let x = 0;
        Object.keys(mockNewUserObject).forEach(function (key) {
            newUserQueryKeys.push(key);
            newUserPostQuery = `${newUserPostQuery} '${mockNewUserObject[key]}'`;
            if (x < ((Object.keys(mockNewUserObject)).length - 1)) {
                newUserPostQuery = `${newUserPostQuery},`;
            }
            else {
                newUserPostQuery = `${newUserPostQuery})`;
            }
            x++;
        });
        addNewUserQuery = `${newUserPreQuery}(${newUserQueryKeys}) ${newUserPostQuery}`;
        let newUserResponse = yield dbPool.query(addNewUserQuery);
        /*
         to do... catch errors here?
        */
        // add foreign key from 'user' to newRegistration
        newRegistration.user_id = newUserResponse['insertId'];
    }
    newRegistration.created_at = Utils.datetimeTimestamp();
    // check if registration exist w/ same user_id + event_id 
    // if yes: update exisiting. if no: create
    let selectRegistrationQuery = `SELECT * FROM registrations WHERE user_id=${newRegistration.user_id} AND event_id=${newRegistration.event_id}`;
    let existingRegistrationResponse = yield dbPool.query(selectRegistrationQuery);
    if (Object.keys(existingRegistrationResponse).length) {
        newRegistration.updated_at = Utils.datetimeTimestamp();
        // build query 
        let updatedRegistrationQuery = '';
        let updateRegistrationPreQuery = 'UPDATE registrations SET';
        let updateRegistrationQueryKeys = [];
        let updatedRegistrationPostQuery = `WHERE user_id=${newRegistration.user_id} AND event_id=${newRegistration.event_id}`;
        Object.keys(newRegistration).forEach(function (key) {
            if (key === 'event_id' || key === 'user_id') {
                updateRegistrationQueryKeys.push(`${key}=${newRegistration[key]}`);
            }
            else if (key === 'registration_meta') {
                updateRegistrationQueryKeys.push(`${key}='${JSON.stringify(newRegistration[key])}'`);
            }
            else {
                updateRegistrationQueryKeys.push(`${key}='${newRegistration[key]}'`);
            }
        });
        updatedRegistrationQuery = `${updateRegistrationPreQuery} ${updateRegistrationQueryKeys} ${updatedRegistrationPostQuery}`;
        let updatedRegistrationResponse = yield dbPool.query(updatedRegistrationQuery);
        if (updatedRegistrationResponse['affectedRows'] === 1) {
            httpResponse.status_code = 200;
            httpResponse.message = 'Successfully updated existing registration.';
            httpResponse.data = newRegistration;
            return httpResponse;
        }
        httpResponse.status_code = 500;
        httpResponse.message = 'Unable to update existing registration.';
        httpResponse.data = newRegistration;
        return httpResponse;
    }
    // build new registration INSERT query
    let addNewRegQuery = '';
    let newRegPreQuery = 'INSERT INTO registrations';
    let newRegQueryKeys = [];
    let newRegPostQuery = 'VALUES(';
    let y = 0;
    Object.keys(newRegistration).forEach(function (key) {
        newRegQueryKeys.push(key);
        if (key === 'user_id' || key === 'event_id') {
            newRegPostQuery = `${newRegPostQuery} ${newRegistration[key]}`;
        }
        else if (key === 'registration_meta') {
            newRegPostQuery = `${newRegPostQuery} '${JSON.stringify(newRegistration[key])}'`;
        }
        else {
            newRegPostQuery = `${newRegPostQuery} '${newRegistration[key]}'`;
        }
        if (y < ((Object.keys(newRegistration)).length - 1)) {
            newRegPostQuery = `${newRegPostQuery},`;
        }
        else {
            newRegPostQuery = `${newRegPostQuery})`;
        }
        y++;
    });
    addNewRegQuery = `${newRegPreQuery}(${newRegQueryKeys}) ${newRegPostQuery}`;
    let newRegistrationResponse = yield dbPool.query(addNewRegQuery);
    if (newRegistrationResponse['affectedRows'] === 1) {
        httpResponse.status_code = 201;
        httpResponse.message = `Successfully added new registration and corresponding 'users' table record.`;
        httpResponse.data = newRegistration;
        return httpResponse;
    }
    httpResponse.status_code = 500;
    httpResponse.message = 'Unable to add new registration';
    httpResponse.data = newRegistration;
    return httpResponse;
});
// PUT registrations/
exports.update = (updatedRegistration) => __awaiter(void 0, void 0, void 0, function* () {
    let httpResponse = {
        status_code: null,
        message: '',
        data: {}
    };
    let registration_id = updatedRegistration.id;
    if (registration_id == null) {
        httpResponse.status_code = 400;
        httpResponse.message = 'Missing registration id field.';
        httpResponse.data = {};
        return httpResponse;
    }
    // check if valid registration id 
    let qy = `SELECT * FROM registrations WHERE id='${registration_id}'`;
    let rs = yield dbPool.query(qy);
    if (!Object.keys(rs).length) {
        httpResponse.status_code = 404;
        httpResponse.message = 'Registration with this id does not exist.';
        httpResponse.data = { 'id': registration_id };
        return httpResponse;
    }
    ;
    // add updated_at timestamp to updatedRegistration
    updatedRegistration.updated_at = Utils.datetimeTimestamp();
    // build query 
    let query = '';
    let preQuery = 'UPDATE registrations SET';
    let queryKeys = [];
    let postQuery = `WHERE id=${registration_id}`;
    Object.keys(updatedRegistration).forEach(function (key) {
        if (key !== 'id') {
            queryKeys.push(`${key}='${updatedRegistration[key]}'`);
        }
    });
    query = `${preQuery} ${queryKeys} ${postQuery}`;
    yield dbPool.query(query);
    httpResponse.status_code = 200;
    httpResponse.message = 'Successfully updated registration.';
    httpResponse.data = updatedRegistration;
    return httpResponse;
});
// DELETE registrations/
exports.remove = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let http_response = {
        status_code: null,
        message: '',
        data: {}
    };
    //  const record: User = users[id];
    let qy = `SELECT * FROM registrations`;
    let rs = yield dbPool.query(qy);
    if (!Object.keys(rs).length) {
        // res.status(204)
        //   .send({
        //     message: 'There are no registrations to delete.',
        //     status: res.status
        //   });
    }
    else {
        let query = `DELETE FROM registrations`;
        yield dbPool.query(query);
        // res.status(200)
        //   .send({
        //     message: 'Successfully deleted registration.',
        //     status: res.status,
        //     rs
        //   });
    }
    throw new Error('No record found to delete');
});
