const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  let threadId;
  const board = 'test-board';
  const deletePassword = 'delete_password';

  suite('API ROUTING FOR /api/threads/:board', function() {
    test('Test POST /api/threads/:board => create new thread', function(done) {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board,
          text: 'test thread',
          delete_password: deletePassword
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          threadId = res.body._id;
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'bumped_on');
          assert.property(res.body, 'reported');
          assert.property(res.body, 'board');
          assert.property(res.body, 'text');
          assert.property(res.body, 'delete_password');
          assert.property(res.body, 'replies');
          done();
        });
    });

    test('Test GET /api/threads/:board => get 10 recent threads', function(done) {
      chai.request(server)
        .get(`/api/threads/${board}`)
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body);
          assert.isAtMost(res.body.length, 10);
          for (const thread of res.body) {
            assert.isAtMost(thread.replies.length, 3);
          }
          done();
        });
    });

    test('Test PUT /api/threads/:board => report a thread', function(done) {
      chai.request(server)
        .put(`/api/threads/${board}`)
        .send({ thread_id: threadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });

  suite('API ROUTING FOR /api/replies/:board', function() {
    let replyId;

    before(function(done) {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board,
          text: 'thread for replies test',
          delete_password: deletePassword
        })
        .end(function(err, res) {
          threadId = res.body._id;
          done();
        });
    });

    test('Test POST /api/replies/:board => create new reply', function(done) {
      chai.request(server)
        .post(`/api/replies/${board}`)
        .send({
          thread_id: threadId,
          text: 'test reply',
          delete_password: deletePassword
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          replyId = res.body._id;
          assert.property(res.body, 'created_on');
          assert.property(res.body, 'text');
          assert.property(res.body, 'delete_password');
          assert.property(res.body, 'reported');
          done();
        });
    });

    test('Test GET /api/replies/:board => get a thread with all replies', function(done) {
      chai.request(server)
        .get(`/api/replies/${board}`)
        .query({ thread_id: threadId })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, '_id');
          assert.property(res.body, 'replies');
          assert.isArray(res.body.replies);
          done();
        });
    });

    test('Test PUT /api/replies/:board => report a reply', function(done) {
      chai.request(server)
        .put(`/api/replies/${board}`)
        .send({
          thread_id: threadId,
          reply_id: replyId
        })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'reported');
          done();
        });
    });
  });

  suite('DELETE tests', function () {
    let deleteThreadId;
    let replyId;

    before(function (done) {
      chai.request(server)
        .post(`/api/threads/${board}`)
        .send({
          board,
          text: 'thread to be deleted',
          delete_password: deletePassword,
        })
        .end(function (err, res) {
          deleteThreadId = res.body._id;
          chai.request(server)
            .post(`/api/replies/${board}`)
            .send({
              thread_id: deleteThreadId,
              text: 'reply to be deleted',
              delete_password: deletePassword,
            })
            .end(function (err, res) {
              replyId = res.body._id;
              done();
            });
        });
    });

    test('Test DELETE /api/threads/:board with wrong password', function (done) {
      chai.request(server)
        .delete(`/api/threads/${board}`)
        .send({
          thread_id: deleteThreadId,
          delete_password: 'wrong_password',
        })
        .end(function (err, res) {
          assert.equal(res.status, 404);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Test DELETE /api/replies/:board with wrong password', function (done) {
      chai.request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id: deleteThreadId,
          reply_id: replyId,
          delete_password: 'wrong_password',
        })
        .end(function (err, res) {
          assert.equal(res.status, 404);
          assert.equal(res.text, 'incorrect password');
          done();
        });
    });

    test('Test DELETE /api/replies/:board with correct password', function (done) {
      chai.request(server)
        .delete(`/api/replies/${board}`)
        .send({
          thread_id: deleteThreadId,
          reply_id: replyId,
          delete_password: deletePassword,
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });

    test('Test DELETE /api/threads/:board with correct password', function (done) {
      chai.request(server)
        .delete(`/api/threads/${board}`)
        .send({
          thread_id: deleteThreadId,
          delete_password: deletePassword,
        })
        .end(function (err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.text, 'success');
          done();
        });
    });
  });
});
