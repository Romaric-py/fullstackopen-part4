const dummy = (blogs) => {
  return 1
}

const totalLikes = (blogs) => {
  return blogs.reduce((likes, blog) => likes + blog.likes, 0)
}

const favoriteBlog = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const favorite = blogs.reduce((prev, current) => (prev.likes > current.likes) ? prev : current)
  
  return favorite
}

const mostBlogs = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const authorCounts = blogs.reduce((counts, blog) => {
    counts[blog.author] = (counts[blog.author] || 0) + 1
    return counts
  }, {})

  const authorWithMostBlogs = Object.keys(authorCounts).reduce((prev, current) => (authorCounts[prev] > authorCounts[current]) ? prev : current)

  return {
    author: authorWithMostBlogs,
    blogs: authorCounts[authorWithMostBlogs]
  }
}

const mostLikes = (blogs) => {
  if (blogs.length === 0) {
    return null
  }

  const authorLikes = blogs.reduce((likes, blog) => {
    likes[blog.author] = (likes[blog.author] || 0) + blog.likes
    return likes
  }, {})

  const authorWithMostLikes = Object.keys(authorLikes).reduce((prev, current) => (authorLikes[prev] > authorLikes[current]) ? prev : current)

  return {
    author: authorWithMostLikes,
    likes: authorLikes[authorWithMostLikes]
  }
}

module.exports = {
  dummy,
  totalLikes,
  favoriteBlog,
  mostBlogs,
  mostLikes,
}
