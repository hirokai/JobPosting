#!/usr/bin/env ruby

#Scraping for JREC-IN

require 'rubygems'
require 'open-uri'
require 'nokogiri'

# agent = Mechanize.new

# subfolders = ["社会科学","化学","工学","医歯薬学","情報学","生物学","複合領域"]

links = []
	files = Dir.glob("search/**/*.html")
	for file in files
		puts file
		open(file) {|f|
			page = f.read
			doc = Nokogiri::HTML(page)
			ls = doc.css('a[href]').map{|a| a['href']}
					.map{|href| href =~ /id=(D\d{9})/; $1}.compact
					.select{|id| path = "details/#{id}.html"; not File.exist? path}
			links << ls
		}
	end

links = links.flatten

puts "#{links.length} files will be downloaded."

for l,i in links.each_with_index
	url = "https://jrecin.jst.go.jp/seek/SeekJorDetail?id=#{l}"
	path = "details/#{l}.html"
	STDERR.puts "#{i+1}/#{links.length}: Fetching: #{url}"
	open(url){|f|
		page = f.read
		IO.write(path,page)
	}
	sleep(2)
end
