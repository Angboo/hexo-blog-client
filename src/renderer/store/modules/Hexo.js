import when from 'when'
const Hexo = require('hexo')
const fs = require('fs')

const state = {
  instance: null,
  inited: false,
  dialogFormVisible: false,
  selectedPostId: null,
  keyword: ''
}
const mutations = {
  setInstance (state, hexo) {
    state.instance = hexo
  },
  setInited (state) {
    state.inited = true
  },
  setDialogFormVisible (state, show) {
    state.dialogFormVisible = show
  },
  setSelectedPostId (state, postId) {
    state.selectedPostId = postId
  },
  setKeyWord (state, keyword) {
    state.keyword = keyword
  }
}
const actions = {
  // 初始化
  async init (context) {
    try {
      let config = context.rootState.Config.config
      if (!config || !config.path) {
        context.commit('setDialogFormVisible', true)
      } else {
        config.path = config.path.constructor === Array ? config.path.join() : config.path
        console.log(config.path)
        let hexo = new Hexo(config.path, {
          debug: false
        })
        console.log(hexo)
        await hexo.init()
        await hexo.call('server', {})
        // await hexo.watch()
        context.commit('setInstance', hexo)
        context.commit('setInited')
      }
    } catch (error) {
      console.log(error)
      context.commit('setDialogFormVisible', true)
    }
  },

  // 销毁
  destroy (context) {
    context.state.instance.unwatch()
  },

  // 获取文章
  getPost (context, postId) {
    return context.state.instance.locals.get('posts').findOne({_id: postId})
  },

  // 选中文章
  selectPost (context, postId) {
    context.commit('setSelectedPostId', postId)
  },

  // 验证表单
  validatePostForm (context, postForm) {
    let deferred = when.defer()
    postForm.validate(function (valid) {
      deferred.resolve(valid)
    })
    return deferred.promise
  },

  // 创建、修改文章
  async createPost (context, postForm) {
    let deferred = when.defer()
    let hexo = context.state.instance
    hexo.post.create(postForm, true).then(function () {
      deferred.resolve()
    }, function (err) {
      deferred.reject(err)
    })
    return deferred.promise
  },

  // 保存为草稿
  async createDraft (context, postForm) {
    let deferred = when.defer()
    let hexo = context.state.instance
    // 将草稿发布为文章
    // hexo.post.publish(postForm, true).then(function () {
    //   deferred.resolve()
    // }, function (err) {
    //   deferred.reject(err)
    // })
    hexo.post.render('E:\\前端学习\\个人博客\\hexo-blog\\source\\_drafts', postForm).then(function () {
      deferred.resolve()
    }, function (err) {
      deferred.reject(err)
    })
    return deferred.promise
  },

  // 删除文章
  async deletePost (context, postId) {
    let post = await context.dispatch('getPost', postId)
    let deferred = when.defer()
    fs.unlink(post.full_source, (err) => {
      if (err) {
        deferred.reject(err)
      } else {
        context.commit('setSelectedPostId', undefined) // 重置一下当前选中的文章
        deferred.resolve(post)
      }
    })
    return deferred.promise
  }
}
const getters = {
  tags: state => {
    let tags = []
    let temp = state.instance.locals.get('tags')
    if (temp && temp.length > 0) {
      temp.forEach(tag => tags.push(tag.name))
    }
    return tags
  },
  categories: state => {
    let categories = []
    let temp = state.instance.locals.get('categories')
    if (temp && temp.length > 0) {
      temp.forEach(category => categories.push(category.name))
    }
    return categories
  },
  posts: state => {
    let posts = []
    let temp = state.instance.locals.get('posts').sort('date', -1)
    if (temp && temp.length > 0) {
      temp.forEach(post => {
        posts.push({
          id: post._id,
          title: post.title,
          date: post.date.format('YYYY-MM-DD hh:mm:ss'),
          author: post.author,
          tags: post.tags.data,
          categories: post.categories.data,
          img: post.img || '',
          top: post.top || false
        })
      })
    }
    console.log(posts)
    return posts
  },
  selectedPost: state => {
    let posts = state.instance.locals.get('posts').sort('date', -1)
    let selectedPostId = state.selectedPostId
    if (!selectedPostId) { // 如果没选中，那么默认显示第一篇
      selectedPostId = posts.toArray()[0].toObject()._id
    }
    return posts.findOne({_id: selectedPostId}).toObject()
  }
}
export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
