const { test, describe } = require('node:test')
const assert = require('node:assert')
const { mostBlogs } = require('../utils/list_helper')
const { initialBlogs } = require('./test_helper')


describe('mostBlogs', () => {
    test('mostBlogs should return null for an empty list', () => {
        const result = mostBlogs([])
        assert.strictEqual(result, null)
    })

    test('mostBlogs should return the author with the most blogs', () => {
        const result = mostBlogs(initialBlogs)
        assert.deepStrictEqual(result, { author: "Robert C. Martin", blogs: 3 })
    })

    test('mostBlogs should return the only author when there is one blog', () => {
        const singleBlogList = [initialBlogs[0]]
        const result = mostBlogs(singleBlogList)
        assert.deepStrictEqual(result, { author: "Michael Chan", blogs: 1 })
    })

    test('mostBlogs should return one of the authors with the most blogs when there are multiple', () => {
        const blogsWithMultipleMosts = [...initialBlogs, {
            _id: "5a422bd61b54a676234d17fd",
            title: "New blog",
            author: "Edsger W. Dijkstra",
            url: "http://example.com/new-blog",
            likes: 0,
            __v: 0
        }]
        const result = mostBlogs(blogsWithMultipleMosts)
        assert.strictEqual(result.blogs, 3)
        assert.strictEqual(["Robert C. Martin", "Edsger W. Dijkstra"].includes(result.author), true)
    })
})