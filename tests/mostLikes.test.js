const { test, describe } = require('node:test')
const assert = require('node:assert')
const { mostLikes } = require('../utils/list_helper')
const { initialBlogs } = require('./test_helper')

describe('mostLikes', () => {
    test('mostLikes should return null for an empty list', () => {
        const result = mostLikes([])
        assert.strictEqual(result, null)
    })

    test('mostLikes should return the author and total likes of the only blog when there is one blog', () => {
        const singleBlogList = [initialBlogs[0]]
        const result = mostLikes(singleBlogList)
        assert.deepStrictEqual(result, { author: "Michael Chan", likes: 7 })
    })

    test('mostLikes should return the author with the most likes when there is a clear one', () => {
        const result = mostLikes(initialBlogs)
        assert.deepStrictEqual(result, { author: "Edsger W. Dijkstra", likes: 17 })
    })

    test('mostLikes should return one of the authors with the most likes when there are multiple', () => {
        const blogsWithMultipleTopAuthors = [
            ...initialBlogs,
            {
                _id: "5a422bd61b54a676234d17fd",
                title: "Another blog by Robert C. Martin",
                author: "Robert C. Martin",
                url: "http://blog.cleancoder.com/uncle-bob/2018/01/01/AnotherBlog.html",
                likes: 5,
                __v: 0
            }
        ]

        const result = mostLikes(blogsWithMultipleTopAuthors)
        assert.strictEqual(result.likes, 17)
        assert.strictEqual(result.author === "Edsger W. Dijkstra" || result.author === "Robert C. Martin", true)
    })
})