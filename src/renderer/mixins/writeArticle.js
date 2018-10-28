import { mapGetters } from 'vuex'
import qiniuManager from '@/service/QiniuManager'
import when from 'when'

export default {
  data () {
    return {
      postForm: {
        title: '',
        originContent: '',
        content: '',
        tags: [],
        categories: [],
        toc: false,
        img: '',
        top: false
      },
      postFormRules: {
        title: [
          {required: true, message: '请输入标题', trigger: 'blur'},
          {min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur'}
        ],
        content: [
          {required: true, message: '请输入内容', trigger: 'blur'}
        ],
        img: [
          {message: '请输入图片地址', trigger: 'blur'}
        ]
      },
      uploading: false,
      uploadingText: 'loading...',
      contentHeight: '',
      formChanged: false,
      fullScreenFlag: false,
      toolbars: {
        bold: true, // 粗体
        italic: true, // 斜体
        header: true, // 标题
        underline: true, // 下划线
        strikethrough: true, // 中划线
        mark: true, // 标记
        superscript: true, // 上角标
        subscript: true, // 下角标
        quote: true, // 引用
        ol: true, // 有序列表
        ul: true, // 无序列表
        link: true, // 链接
        imagelink: true, // 图片链接
        code: true, // code
        table: true, // 表格
        fullscreen: true, // 全屏编辑
        // readmodel: true, // 沉浸式阅读
        // htmlcode: true, // 展示html源码
        help: true, // 帮助
        /* 1.3.5 */
        undo: true, // 上一步
        redo: true, // 下一步
        // trash: true, // 清空
        save: true, // 保存（触发events中的save事件）
        /* 1.4.2 */
        navigation: true, // 导航目录
        /* 2.1.8 */
        alignleft: true, // 左对齐
        aligncenter: true, // 居中
        alignright: true, // 右对齐
        /* 2.2.1 */
        subfield: true, // 单双栏模式
        preview: true // 预览
      }
    }
  },
  mounted () {
    this.resize()
    window.addEventListener('resize', this.resize)
  },
  beforeDestroy () {
    window.removeEventListener('resize', this.resize)
  },
  beforeRouteLeave (to, from, next) {
    if (this.formChanged) {
      if (window.confirm('有未保存的更改，确认离开吗？')) {
        next()
      } else {
        next(false)
      }
    } else {
      next()
    }
  },
  methods: {
    isFormChanged () {
      return this.formChanged || this.postForm.originContent.trim() !== this.postForm.content.trim()
    },
    async saveToDraft () {
      let valid = await this.$store.dispatch('Hexo/validatePostForm', this.$refs.postForm)
      if (valid) {
        try {
          await this.$store.dispatch('Hexo/createDraft', this.postForm)
          this.formChanged = false
          this.postForm.originContent = this.postForm.content
          this.$notify({title: '成功', message: '保存成功', type: 'success'})
        } catch (err) {
          console.log('错误信息：', err)
          this.$notify.error({title: '错误', message: '保存失败'})
        }
      } else {
        this.$notify.error({title: '错误', message: '表单验证失败'})
      }
    },
    async submitForm () {
      let valid = await this.$store.dispatch('Hexo/validatePostForm', this.$refs.postForm)
      if (valid) {
        try {
          await this.$store.dispatch('Hexo/createPost', this.postForm)
          this.formChanged = false
          this.postForm.originContent = this.postForm.content
          this.$notify({title: '成功', message: '保存成功', type: 'success'})
        } catch (err) {
          this.$notify.error({title: '错误', message: '保存失败'})
        }
      } else {
        this.$notify.error({title: '错误', message: '表单验证失败'})
      }
    },

    imgsAdd (files) {
      var me = this
      me.uploading = true
      me.uploadingText = '正在上传 ' + files.length + ' 张图片...'

      var promises = []
      for (var i = 0; i < files.length; i++) {
        promises.push(qiniuManager.upload(files[i]))
      }

      when.all(promises).then(results => {
        results.forEach(imageUrl => {
          var editor = me.$refs.editor
          editor.insertText(editor.getTextareaDom(), {
            prefix: '![](' + imageUrl + ')\n',
            subfix: '',
            str: ''
          })
          me.uploading = false
        })
        me.uploading = false
      }, errs => {
        me.$notify.error({
          message: '图片上传失败：' + errs
        })
        me.uploading = false
      })
    },

    fullScreen (status) {
      this.fullScreenFlag = status
    },

    resize () {
      if (this.fullScreenFlag) {
        this.contentHeight = (document.documentElement.clientHeight) + 'px'
      } else {
        this.contentHeight = (document.documentElement.clientHeight - 370) + 'px'
      }
    }
  },
  watch: {
    fullScreenFlag: function () {
      this.resize()
    }
  },
  computed: {
    ...mapGetters({
      tags: 'Hexo/tags',
      categories: 'Hexo/categories'
    })
  }
}
