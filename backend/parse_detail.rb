#!/usr/bin/env ruby

require 'rubygems'
require 'nokogiri'
require 'fileutils'

DATA_ID = '20141004_1'

require 'json'

def chomp(s)
	if s.nil?
		nil
	else
		s.gsub(/[\r\n  ]+$/,'').gsub(/^[\r\n ]+/,'').gsub(/[\r\n]/,',')
	end
end

outfolder = ENV['HOME'] + '/repos/JobPosting/app/data/'+DATA_ID

if not File.exist? outfolder
	FileUtils.mkdir_p outfolder
end

files = Dir.glob("details/D*.html")
puts "#{files.length} files"

res = files.map.with_index{|file,i|
	if i % 100 == 0 and i > 0
		puts  "#{i} files processed."
	end
	open(file){|f|
		doc = Nokogiri::HTML(f.read)
		rows = doc.css('#detail_contents table table > tr')
		hash = Hash[*rows.map{|r|
			tds = r.css('> td');
			if tds.length == 2
				tds[0].text =~ /(.*[ぁ-んァ-ヴー一-龠亜-煕]+)[^ぁ-んァ-ヴー一-龠亜-煕]+/
				k = $1
				if k == '研究分野'
					[k,tds[1].css('table').map{|t|
						 tr = t.css('tr')[0]
						 td = tr ? tr.css('td')[2] : nil
						 td ? td.text : nil
					}.compact.join(':')]
				elsif k == '職種'
					[k,tds[1].css('table > tr').map{|tr|
						 td = tr.css('td')[1]
						 td ? td.text : nil
					}.compact.join(':')]
				elsif k == '求人内容'
					[k,chomp(tds[1].inner_html)]
				else
					[k,chomp(tds[1].text)]
				end
			else
				[]
			end
			}.flatten(1)]
#		p hash
		if not hash['データ番号']
			file =~ /(D\d{9})/
			hash['データ番号'] = $1
		end

		loc = hash['勤務地']
		locs = if loc
			chomp(loc)
		else
			nil
		end
		def get_period(str)
			s = chomp(str)
#			p s
			s =~ /(\d{4})年(\d{2})月(\d{2})日.+～,(\d{4})年(\d{2})月(\d{2})日.+必着(,(.*))?$/u
			if $~
#				puts 'Matching!'
				"#{$1}-#{$2}-#{$3}:#{$4}-#{$5}-#{$6}:#{$8 or 'NA'}"
			else
				s =~ /(\d{4})年(\d{2})月(\d{2})日.+必着(,(.+))?$/u
				if $~
	#				puts 'Matching!'
					"NA:#{$1}-#{$2}-#{$3}:#{$5 or 'NA'}"
				else
					s
				end				
			end
		end
		period = get_period(hash['募集期間'])
		preflist = {"愛知県" => "Aichi", "愛媛県" => "Ehime", "茨城県" => "Ibaraki", "岡山県" => "Okayama", "沖縄県" => "Okinawa", "岩手県" => "Iwate", "岐阜県" => "Gifu", "宮崎県" => "Miyazaki", "宮城県" => "Miyagi", "京都府" => "Kyoto", "熊本県" => "Kumamoto", "群馬県" => "Gunma", "広島県" => "Hiroshima", "香川県" => "Kagawa", "高知県" => "Kochi", "佐賀県" => "Saga", "埼玉県" => "Saitama", "三重県" => "Mie", "山形県" => "Yamagata", "山口県" => "Yamaguchi", "山梨県" => "Yamanashi", "滋賀県" => "Shiga", "鹿児島県" => "Kagoshima", "秋田県" => "Akita", "新潟県" => "Niigata", "神奈川県" => "Kanagawa", "青森県" => "Aomori", "静岡県" => "Shizuoka", "石川県" => "Ishikawa", "千葉県" => "Chiba", "大阪府" => "Osaka", "大分県" => "Oita", "長崎県" => "Nagasaki", "長野県" => "Nagano", "鳥取県" => "Tottori", "島根県" => "Shimane", "東京都" => "Tokyo", "徳島県" => "Tokushima", "栃木県" => "Tochigi", "奈良県" => "Nara", "富山県" => "Toyama", "福井県" => "Fukui", "福岡県" => "Fukuoka", "福島県" => "Fukushima", "兵庫県" => "Hyōgo", "北海道" => "Hokkaido", "和歌山県" => "Wakayama"}
		locen = locs ? preflist[locs.split(',')[1]] : nil

		hash['公開開始日'] =~ /(\d{4})年(\d{2})月(\d{2})日/u
		time = begin
				Time.local($1.to_i,$2.to_i,$3.to_i)
			rescue
				nil
			end

		title = chomp(hash['職種'])
		title = title ? title.gsub(',','') : nil
		r = {:time => time, :subject => hash['求人件名'], :period => period, :place => locs,
			:place_en => locen, :genre => hash['研究分野'], :institution => hash['機関名'],
			:title => title, :id => chomp(hash['データ番号']),:data => hash
		}
		IO.write("#{outfolder}/#{r[:id]}.json",JSON.generate(r))
		r
	#	p hash['研究分野']
	}
}

require 'csv'
json = []

CSV.open("#{outfolder}/list.csv", "wb") do |csv|
	keys = ["id","date","period","subject","title","place","place_en","genre","institution"]
	csv << keys
	res.sort{|a,b| (b[:time] || Time.local(2000,1,1)) <=> (a[:time] || Time.local(2000,1,1) )}.each{|r|
		vs = [r[:id],r[:time] ? r[:time].strftime("%Y-%m-%d") : nil,r[:period], r[:subject],r[:title],r[:place],r[:place_en],r[:genre],r[:institution]]
		csv << vs
		json << Hash[keys.zip(vs)]
	}
end

IO.write("#{outfolder}/list.json",JSON.generate(json))

