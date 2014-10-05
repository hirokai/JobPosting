#!/usr/bin/env ruby

#Scraping for JREC-IN

require 'rubygems'
require 'open-uri'
require 'nokogiri'
require 'fileutils'

data_id = "20141005_01"
pages = 1

genres = [{'name' => "総合人文社会", 'code' => "00012"},{'name' => "人文学", 'code' => "00001"},{'name' => "社会科学", 'code' => "00002"},{'name' => "総合理工", 'code' => "00013"},{'name' => "数物系科学", 'code' => "00003"},{'name' => "化学", 'code' => "00004"},{'name' => "工学", 'code' => "00005"},{'name' => "総合生物", 'code' => "00014"},{'name' => "生物学", 'code' => "00006"},{'name' => "農学", 'code' => "00007"},{'name' => "医歯薬学", 'code' => "00008"},{'name' => "情報学", 'code' => "00015"},{'name' => "環境学", 'code' => "00016"},{'name' => "複合領域", 'code' => "00017"},{'name' => "その他", 'code' => "99999"}].shuffle;


def get(outfile,url)
	if File.exist? outfile
		puts 'Reading from file: ' + outfile
		IO.read(outfile)
	else
		puts 'Fetching:' + url
		sleep(2)
		p = ''
		open(url) {|f|
			p = f.read
			IO.write(outfile,p)
		}
		p
	end
end

for g in genres
	outfolder = "/Users/hiroyuki/repos/JobPosting/backend/search/" + data_id + '/' +g['name']
	puts g['name']
	if not File.exist? outfolder
		FileUtils.mkdir_p outfolder
	end

	outfile = "#{outfolder}/#{data_id}_01.html"
	url = "https://jrecin.jst.go.jp/seek/SeekJorSearch?fn=1&dt=2&page=1&sort=0&keyword_and=&keyword_or=&keyword_not=&bg1=#{g['code']}&sm1=.....&bg2=&sm2=&bg3=&sm3=&bg4=&sm4=&bg5=&sm5=&bg6=&sm6=&bgCode1=#{g['code']}&smCode1=.....&bgCode2=&smCode2=&bgCode3=&smCode3=&bgCode4=&smCode4=&bgCode5=&smCode5=&bgCode6=&smCode6=&jobform=&jobterm=&dispcount=50"

	page = get(outfile,url)

	page =~ /(\d+)件が該当/u
	pages = ($1.to_i/50).ceil

	for i in 2..pages
		url = "https://jrecin.jst.go.jp/seek/SeekJorSearch?fn=1&dt=2&page=#{i}&sort=0&keyword_and=&keyword_or=&keyword_not=&bg1=#{g['code']}&sm1=.....&bg2=&sm2=&bg3=&sm3=&bg4=&sm4=&bg5=&sm5=&bg6=&sm6=&bgCode1=#{g['code']}&smCode1=.....&bgCode2=&smCode2=&bgCode3=&smCode3=&bgCode4=&smCode4=&bgCode5=&smCode5=&bgCode6=&smCode6=&jobform=&jobterm=&dispcount=50"
		outfile = "#{outfolder}/#{data_id}_#{"%02d" % i}.html"
		get(outfile,url)
	end
end

