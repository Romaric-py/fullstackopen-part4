const { test, describe } = require("node:test")
const assert = require("node:assert")
const { favoriteBlog } = require("../utils/list_helper")
const { initialBlogs } = require("./test_helper")

describe("favoriteBlog", () => {
  const listWithOneBlog = [initialBlogs[0]]

  const blogsWithOneFavorite = initialBlogs

  const blogsWithMultipleFavorites = [
    ...initialBlogs,
    {
      _id: "5a422b3a1b54a676234d17f9",
      title: "Canonical string reduction",
      url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
      likes: 12,
      __v: 0,
    },
  ]

  test("empty list returns null", () => {
    const result = favoriteBlog([])
    assert.strictEqual(result, null)
  })

  test("when list has only one blog, returns that blog", () => {
    const result = favoriteBlog(listWithOneBlog)
    assert.deepStrictEqual(result, listWithOneBlog[0])
  })

  test("returns the blog with the most likes when there is a clear favorite", () => {
    const result = favoriteBlog(blogsWithOneFavorite)
    assert.deepStrictEqual(result, blogsWithOneFavorite[2])
  })

  test("returns one of the blogs with the most likes when there are multiple favorites", () => {
    const result = favoriteBlog(blogsWithMultipleFavorites)
    assert.strictEqual(result.likes, 12)
  })
})
