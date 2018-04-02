function replaceAnchors (txt) {
	txt = txt.replace(/#(\S*)/g,'<a target="_BLANK" style="text-decoration: none;" href="http://twitter.com/#!/search/$1">#$1</a>')
	return anchorme(txt, {
		attributes: [
		{
			name: 'class',
			value: 'tweet-text'
		},
		{
			name: 'target',
			value: '_BLANK'
		}
		]})
}

function getParameterByName(name, url) {
	if (!url) url = window.location.href;
	name = name.replace(/[\[\]]/g, "\\$&");
	const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
	results = regex.exec(url);
	if (!results) return null;
	if (!results[2]) return '';
	return decodeURIComponent(results[2].replace(/\+/g, " "));
}

new Vue({
	el: '#app',
	data: () => ({
		search: null,
		list: [],
		startInfiniteHandler: false,
		currentMaxId: null,
		showSearch: false,
		imageDialog: false,
		image: {},
		loading: false,
		extractedText: null,
		sheet: false,
		introMsg: true,
		searchLabel: 'Search'
	}),
	methods: {
		fetchTweets () {
			if (!this.search) return
				this.currentMaxId = null
			this.list.length = 0
			this.$refs.topProgress.start()
			fetch(`/statuses?q=${this.search}`)
			.then((res) => res.json())
			.then((data) => {
				this.introMsg = (data.statuses.length > 0) ? false : true
				this.$refs.topProgress.done()
				if (data.search_metadata.hasOwnProperty('next_results')) {
					this.currentMaxId = getParameterByName('max_id', data.search_metadata.next_results)
				}
				this.list = data.statuses.map((d) => {
					if (d.hasOwnProperty('retweeted_status')) {
						d.full_text = `Retweet from @${d.retweeted_status.user.screen_name}:<br>${d.retweeted_status.full_text}`
					}
					if (d.entities.hasOwnProperty('media')) {
						d.showMedia = true
					}
					d.full_text = replaceAnchors(d.full_text)
					return d
				})
			})
			.catch((e) => {
				console.error(e)
			})
		},
		loadMore ($state) {
			this.$refs.topProgress.start()
			fetch(`/statuses?q=${this.search}&max_id=${this.currentMaxId}`)
			.then((res) => res.json())
			.then((data) => {
				this.introMsg = (data.statuses.length > 0) ? false : true
				this.$refs.topProgress.done()
				if (data.search_metadata.hasOwnProperty('next_results')) {
					this.currentMaxId = getParameterByName('max_id', data.search_metadata.next_results)
				} else {
					$state.complete();
				}
				const list = data.statuses.map((d) => {
					if (d.hasOwnProperty('retweeted_status')) {
						d.full_text = `Retweet from @${d.retweeted_status.user.screen_name}:<br>${d.retweeted_status.full_text}`
					}
					if (d.entities.hasOwnProperty('media')) {
						d.showMedia = true
					}
					d.full_text = replaceAnchors(d.full_text)
					return d
				})
				this.list.push(...list)
				$state.loaded()
			})
			.catch((e) => {
				console.error(e)
			})
		},
		viewFullImage (media) {
			this.image = Object.assign({}, media)
			this.imageDialog = true
		},
		extractText () {
			this.$refs.topProgress.start()
			this.loading = true
			const job = Tesseract.recognize(this.image.media_url_https)
			job.progress(message => console.log(message))
			job.catch(err => console.error(err))
			job.then(result => {
				console.log(result)
				this.extractedText = result.text
			})
			job.finally(resultOrError => {
				this.$refs.topProgress.done()
				this.sheet = true
				this.loading = false
			})
		},
		listen () {
			annyang.start({debug: true})
			this.searchLabel = 'Listening...'
		}
	},
	created () {
		if (annyang) {
			const commands = {
				'search (for) *tag': (tag) => {
					this.search = tag
					this.fetchTweets()
					annyang.abort()
					this.searchLabel = 'Search'
				}
			}
			annyang.addCommands(commands)
		}
	},
	filters: {
		readableDate (val) {
			return moment(val).format('MMM d, YYYY h:mm A')
		}
	}
})

Vue.config.productionTip = false
moment.suppressDeprecationWarnings = true