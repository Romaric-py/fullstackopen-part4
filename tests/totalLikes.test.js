const { test, describe } = require('node:test')
const assert = require('node:assert')
const { totalLikes } = require('../utils/list_helper')
const { initialBlogs } = require('./test_helper')

describe('totalLikes', () => {
    test('totalLikes should return zero for empty array', () => {
        const result = totalLikes([])
        assert.strictEqual(result, 0)
    })

    test('when list has only one blog, equals the likes of that', () => {
        const listWithOneBlog = [initialBlogs[0]]
        const result = totalLikes(listWithOneBlog)
        assert.strictEqual(result, 7)
    })

    test('totalLikes should return the sum of likes for all initialBlogs', () => {
        const result = totalLikes(initialBlogs)
        assert.strictEqual(result, 36)
    })
})