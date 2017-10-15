function pattern(str) {
	var curLetter = 0;
	var len = str.length;
	var ret = "";
	var usedLetter = new Array(26);
	for(var i = 0; i < len; i++) {
		if(usedLetter[str[i]] == undefined) {
			usedLetter[str[i]] = String.fromCharCode(curLetter + 97);
			curLetter++;
		}
		ret += usedLetter[str[i]];
	}
	return ret;
}


MappingTable = function() {this.mode = MappingTable.impossible;this.debugMode = false;this.unsure = new Array();}
MappingTable.prototype = {
	init : function() {
		this.matrix = new Array(26);
		for(var i = 0; i < 26; i++) {
			this.matrix[String.fromCharCode(97 + i)] = new Array(26);
			var curCol = this.matrix[String.fromCharCode(97 + i)];
			for(var j = 0; j < 26; j++) {
				curCol[String.fromCharCode(97 + j)] = MappingTable.possible;
			}
		}
		this.mode = MappingTable.impossible;
		this.debugMode = false;
	},
	disallow : function(oriChar, matchedChar) {
		if(this.matrix[oriChar][matchedChar] === MappingTable.possible)this.matrix[oriChar][matchedChar] = this.mode;
		this.unsure[oriChar] = this.unsure[oriChar]===undefined? 0:this.unsure[oriChar]++;
		if(this.unsure[oriChar] >=25) {
			var sureWord;
			for(var i = 0; i < 26; i++) {
				if(this.matrix[oriChar][String.fromCharCode(97 + i)] === MappingTable.possible){
					sureWord = String.fromCharCode(97 + i);
					break;
				}
			}
			for(var i = 0; i < 26; i++) {
				if(this.matrix[String.fromCharCode(97 + i)][sureWord] === MappingTable.possible) {
					this.matrix[String.fromCharCode(97 + i)][sureWord] = this.mode;
				}
			}
		}
	},
	getAllowedChars : function(oriChar) {
		ret = new Array();
		for(var i = 0; i < 26; i++) {
			if(this.matrix[oriChar][String.fromCharCode(97 + j)] === MappingTable.possible) {
				ret.push(String.fromCharCode(97 + j));
			}
		}
		return ret;
	},
	isAllowed : function(oriChar, matchedChar) {
		return this.matrix[oriChar][matchedChar];
	},
	tryWord : function(token, word) {
		for(var i = 0; i < token.length; i++) {
			for(var j = 0; j < 26; j++) if(String.fromCharCode(97 + j) !== word[i]) {
				if(this.matrix[token[i]][String.fromCharCode(97 + j)] === MappingTable.possible) {
					this.disallow(token[i], String.fromCharCode(97 + j));
				}
			}
		}
	},
	sure : function(token, word) {
		for(var i = 0; i < token.length; i++) {
			for(var j = 0; j < 26; j++) if(String.fromCharCode(97 + j) !== token[i]) {
				if(this.matrix[String.fromCharCode(97 + j)][word[i]] === MappingTable.possible) {
					this.matrix[String.fromCharCode(97 + j)][word[i]] = this.mode;
				}
			}
		}
	},
	debugMode : function(flag) {
		if(flag == true) {
			this.mode = MappingTable.guessImpossible;
		} else {
			this.mode = MappingTable.impossible;
		}
	},
	rollback : function(lable) {
		for(var i = 0; i < 26; i++) {
			for(var j = 0; j < 26; j++) {
				if(this.matrix[String.fromCharCode(97 + i)][String.fromCharCode(97 + j)] >= lable) {
					this.matrix[String.fromCharCode(97 + i)][String.fromCharCode(97 + j)] = MappingTable.possible;
				}
			}
		}
	}
}

MappingTable.guessImpossible = 2;
MappingTable.possible        = 1;
MappingTable.impossible      = 0;

var mappingTable = new MappingTable();


Token = function(word, possibleList, position){this.word = word; this.possibleList = possibleList; this.position = position; this.del = new Array()};

Token.prototype = {
	eliminate : function(mappingTable) {
		var len = this.word.length,
		    possibleListLen = this.possibleList.length,
		    deleteList = new Array(),
			flag = false;
		// For each possible word, delete it if it's letter is not matched.
		for(var i = 0; i < possibleListLen; i++) if(this.del[i] === undefined || this.del[i] <= 1){
			var flag = 0,
			    possibleWord = this.possibleList[i];
			if(possibleWord === undefined) {
				deleteList[i] = 1;
				continue;
			}
			for(var j = 0; j < len; j++) {			
				if(mappingTable.isAllowed(this.word[j], possibleWord[j]) !== MappingTable.possible) {
					if(mappingTable.debugMode === true) {
						this.del[i] = MappingTable.guessImpossible;
					} else {
						deleteList[i] = 1;
					}
					break;
				}
			}
		}
		for(var i = possibleListLen - 1; i >= 0; i--) {
			if(deleteList[i] === 1) {
				this.possibleList.splice(i, 1);
			}
		}
	},
	trimMappingTable : function(mappingTable) {
		var len = this.word.length,
			possibleListLen = this.possibleList.length,
			possibleLetters = new Array(26);
		for(var i = 0; i < len; i++) {
			for(var j = 0; j < 26; j++) {
				possibleLetters[j] = MappingTable.impossible;
			}
			var curLetter = this.word[i];
			for(var j = 0; j < possibleListLen; j++) if(this.del[j] === undefined || this.del[j] === MappingTable.possible){
				possibleLetters[this.possibleList[j].charCodeAt(i) - 97] = MappingTable.possible;
				
			}
			for(var j = 0; j < 26; j++) {
				if(possibleLetters[j] !== MappingTable.possible) {
					mappingTable.disallow(this.word[i], String.fromCharCode(97 + j));
				}
			}
		}
	},
	customize : function(mappingTable) {
		var ret = this.eliminate(mappingTable);
		this.trimMappingTable(mappingTable);
		return true;
	},
	isSure : function() {
		var ret;
		var tmpLength = this.possibleList.length;
		for(var i = 0; i < this.possibleList.length; i++) {
			if(this.del[i] > 1) {
				tmpLength--;
			} else {
				ret = this.possibleList[i];
			}
		}
		if(tmpLength === 1)return ret;
		if(tmpLength === 0)return 0;
		return false;
	}
}


var ans = new Array();
var g_cnt = 0;
var g_end = false;

function outputAnswer(ans) {
	g_cnt++;
	if(g_cnt > 20) {
		g_end = true;
	}
	console.info(ans);
	for(var i = 0; i < ans.length; i++) {
		for(var j = 0; j < ans[i].possibleList.length; j++) {
			if(ans[i].del[j] <= 1 || ans[i].del[j] === undefined) {
				console.info(ans[i].possibleList[j]);
				break;
			}
		}
	}
}



function refreshQue(queue) {
	var loopTime = 0,
		oriLen = queue.length;
	while(queue.length > 0) {
		var topToken = queue.shift();
		var res = topToken.customize(mappingTable);
		var isSure = topToken.isSure();
		if(isSure === 0) {
			return false;
		}
		if((mappingTable.debugMode === false && topToken.possibleList.length > 1) || (mappingTable.debugMode === true && isSure === false)) {
			queue.push(topToken);
			loopTime++;
		} else {
			ans[topToken.position] = topToken;
			mappingTable.sure(topToken.word, isSure);
		}
		if(loopTime > 2 * oriLen)break;
	}
}


SameWord = function(letter, pos1, pos2) {
	this.letter = letter;
	this.pos1 = pos1;
	this.pos2 = pos2;
}

function getSameList(str1, str2) {
	var ret = new Array();
	var tmpJ = 0;
	for(var i = 0; i < 26; i++) {
		var flag = 0;
		for(var j = 0; j < str1.length; j++) {
			if(str1[j] === String.fromCharCode(i + 97)) {
				flag = 1;
				tmpJ = j;
				break;
			}
		}
		if(flag === 1) {
			for(var j = 0; j < str2.length; j++) {
				if(str2[j] === String.fromCharCode(i + 97))
				{
					ret.push(new SameWord(String.fromCharCode(i + 97), tmpJ, j));
					break;
				}
			}
		}
	}
	return ret;
}



function substitudeMultiLetter(token1, token2, sameList) {
	var tmpList = new Array();
	var deleteList = new Array();
	//mappingTable.init();
	for(var i = 0; i < token1.possibleList.length; i++) {
		var word = token1.possibleList[i];
		var str = "";
		for(var j = 0; j < sameList.length; j++) {
			str += word[sameList[j].pos1];
		}
		tmpList[str] = 1;
	}
	for(var i = 0; i < token2.possibleList.length; i++) {
		var word = token2.possibleList[i];
		var str = "";
		for(var j = 0; j < sameList.length; j++) {
			str += word[sameList[j].pos2];
		}
		if(tmpList[str] !== 1) {
			deleteList[i] = 1;
		}
	}
	for(var i = token2.possibleList.length - 1; i >= 0; i--) {
		if(deleteList[i] === 1) {
			token2.possibleList.splice(i, 1);
		}
	}

	tmpList = new Array();
	deleteList = new Array();
	for(var i = 0; i < token2.possibleList.length; i++) {
		var word = token2.possibleList[i];
		var str = "";
		for(var j = 0; j < sameList.length; j++) {
			str += word[sameList[j].pos2];
		}
		tmpList[str] = 1;
	}
	for(var i = 0; i < token1.possibleList.length; i++) {
		var word = token1.possibleList[i];
		var str = "";
		for(var j = 0; j < sameList.length; j++) {
			str += word[sameList[j].pos1];
		}
		if(tmpList[str] !== 1) {
			deleteList[i] = 1;
		}
	}
	for(var i = token1.possibleList.length - 1; i >= 0; i--) {
		if(deleteList[i] === 1) {
			token1.possibleList.splice(i, 1);
		}
	}

}

function copy(que) {
	var ret = que.slice();
	for(var i = 0; i < ret.length; i++) {
		ret[i] = new Token(que[i].word, que[i].possibleList.slice(), que[i].position);
	}
	return ret;
}



function pickWord(queue, mappingTable) {
	mappingTable.mode = MappingTable.guessImpossible;
	var minIdx  = 0;
	var minimum = queue[0].possibleList.length;
	for(var i = 0; i < queue.length; i++) {
		var token = queue[i];
		var len = token.possibleList.length;
		if(len < minimum) {
			minimum = len;
			minIdx = i;
		}
	}
	var pl = queue[minIdx].possibleList;
	var tmpToken = queue[minIdx];
	var tmpQue = copy(queue);
	var flag = false;
	queue.splice(minIdx, 1);
	var tryNum = 0;
	for(var i = 0; i < minimum; i++)if(tmpToken.del[i] === MappingTable.possible || tmpToken.del[i] === undefined) {
		if(g_end === true) {
			return false;
		}
		if(tryNum > 3)break;
		tmpToken.del[i] = MappingTable.possible;
		mappingTable.tryWord(tmpToken.word, pl[i]);
		mappingTable.sure(tmpToken.word, pl[i]);
		var res = refreshQue(queue);
		if(res === false) {
			tmpToken.del[i] = MappingTable.guessImpossible;
			queue = copy(tmpQue);
			tmpToken = queue[minIdx];
			mappingTable.rollback(MappingTable.guessImpossible);
			continue;
		} else {
			flag = true;
			ans[tmpToken.position] = tmpToken;
			tryNum++;
		}
		if(queue.length > 0) {
			MappingTable.guessImpossible++;
			var res = pickWord(queue, mappingTable);
			MappingTable.guessImpossible--;
		} else {
			outputAnswer(ans);
		}
		queue = copy(tmpQue);
		mappingTable.rollback(MappingTable.guessImpossible);
		tmpToken = queue[minIdx];
		//break;
	}
	queue.push(tmpToken);
	return flag;
}


function substituteSolver(text) {
	g_cnt = 0;
	g_end = false;
	var text = text.toLowerCase();
	var rawTokens = text.split(/[^a-zA-Z0-9\']+/);
	countOfTokens = rawTokens.length;
	mappingTable.init();
	var queue = [];
	for(var i = 0; i < countOfTokens; i++) {
		if(rawTokens[i] == "") {
			continue;
		}
		var possibleList = words[pattern(rawTokens[i])].slice(0);
		var curToken = new Token(rawTokens[i], possibleList, i);
		curToken.customize(mappingTable);
		if(curToken.possibleList.length > 1) {
			queue.push(curToken);
		} else {
			ans[curToken.position] = curToken;
			if(curToken.possibleList.length == 0) {
				mappingTable.sure(rawTokens[i], curToken.possibleList[0]);
			}
		}
	}

	refreshQue(queue);
	console.info(queue[0]);
	console.info(queue[1]);
	for(var i = 0; i < queue.length; i++) {
		for(var j = i + 1; j < queue.length; j++) {
			var sameList = getSameList(queue[i].word, queue[j].word);
			if(sameList.length > 1) {
				substitudeMultiLetter(queue[i], queue[j], sameList);
			}

		}
	}


	for(var i = 0; i < queue.length; i++) {
		ans[queue[i].position] = queue[i];
	}
	console.info(ans);
	for(var i = 0; i < ans.length; i++) {
		console.info(ans[i].possibleList[0]);
	}


	if(queue.length >= 1) {
		mappingTable.debugMode = true;
		pickWord(queue, mappingTable);
		mappingTable.debugMode = false;
	}


	for(var i = 0; i < queue.length; i++) {
		ans[queue[i].position] = queue[i];
	}
	console.info(ans);
	return text;
}





