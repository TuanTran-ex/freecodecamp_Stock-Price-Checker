'use strict';

const { v4: uuidv4 } = require('uuid');

const threadsData = [];

module.exports = function (app) {

  app.route('/api/threads/:board')
    .post(async (req, res) => {
      const { board, text, delete_password } = req.body;

      const thread = {
        _id: uuidv4(),
        created_on: new Date(),
        bumped_on: new Date(),
        reported: false,
        board,
        text,
        delete_password,
        replies: []
      };

      threadsData.push(thread);

      return res.json(thread);
    })
    .put(async (req, res) => {
      const { thread_id } = req.body;
      const thread = threadsData.find(t => t._id === thread_id);
      if (thread) {
        thread.reported = true;
        return res.send('reported');
      }
      res.status(404).send('Not found thread');
    })
    .get(async (req, res) => {
      const sortedThreads = [...threadsData]
        .sort((a, b) => b.bumped_on - a.bumped_on)
        .slice(0, 10);

      const resData = sortedThreads.map(thread => {
        const replies = [...thread.replies]
          .sort((a, b) => b.created_on - a.created_on)
          .slice(0, 3)
          .map(reply => {
            const { delete_password, reported, ...restOfReply } = reply;
            return restOfReply;
          });

        const { delete_password, reported, ...restOfThread } = thread;
        return { ...restOfThread, replies };
      });

      return res.json(resData);
    })
    .delete(async (req, res) => {
      const { thread_id, delete_password } = req.body;
      const threadIndex = threadsData.findIndex(t => t._id === thread_id && t.delete_password === delete_password);

      if (threadIndex > -1) {
        threadsData.splice(threadIndex, 1);
        return res.send('success');
      }

      res.status(404).send('incorrect password');
    });

  app.route('/api/replies/:board')
    .post(async (req, res) => {
      const { thread_id, text, delete_password } = req.body;
      const thread = threadsData.find(t => t._id === thread_id);
      if (thread) {
        const reply = {
          _id: uuidv4(),
          created_on: new Date(),
          text,
          delete_password,
          reported: false
        }
        thread.bumped_on = new Date();
        thread.replies.push(reply);

        return res.status(200).json(reply);
      }

      res.status(404).send('Not found thread');
    })
    .get(async (req, res) => {
      const { thread_id } = req.query;
      const thread = threadsData.find(t => t._id === thread_id);
      if (thread) {
        const replies = thread.replies.map(reply => {
          const { delete_password, reported, ...restOfReply } = reply;
          return restOfReply;
        });
        const { delete_password, reported, ...restOfThread } = thread;
        const threadForResponse = { ...restOfThread, replies };
        return res.json(threadForResponse);
      }

      res.status(404).send('Not found thread');
    })
    .put(async (req, res) => {
      const { thread_id, reply_id } = req.body;
      const thread = threadsData.find(t => t._id === thread_id);
      if (thread) {
        const reply = thread.replies.find(r => r._id === reply_id);
        if (reply) {
          reply.reported = true;
          return res.send('reported');
        }
      }
      return res.status(404).send('Not found reply');
    })
    .delete(async (req, res) => {
      const { thread_id, reply_id, delete_password } = req.body;
      const thread = threadsData.find(t => t._id === thread_id);
      if (thread) {
        const reply = thread.replies.find(r => r._id === reply_id && r.delete_password === delete_password);
        if (reply) {
          reply.text = '[deleted]';
          return res.send('success');
        }
      }

      res.status(404).send('incorrect password');
    });
};
