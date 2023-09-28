import { App} from 'obsidian';
import UltimateTickTickSyncForObsidian from "../main";
export class FileOperation {
    app:App;
    plugin: UltimateTickTickSyncForObsidian;
    
    
    constructor(app:App, plugin:UltimateTickTickSyncForObsidian) {
        //super(app,settings);
        this.app = app;
        this.plugin = plugin;
        
    }
    /*
    async getFrontMatter(file:TFile): Promise<FrontMatter | null> {
        return new Promise((resolve) => {
            this.app.fileManager.processFrontMatter(file, (frontMatter) => {
                resolve(frontMatter);
            });
        });
    }
    */
    
    
    
    
    /*
    async updateFrontMatter(
        file:TFile,
        updater: (frontMatter: FrontMatter) => void
        ): Promise<void> {
            //console.log(`prepare to update front matter`)
            this.app.fileManager.processFrontMatter(file, (frontMatter) => {
                if (frontMatter !== null) {
                    const updatedFrontMatter = { ...frontMatter } as FrontMatter;
                    updater(updatedFrontMatter);
                    this.app.fileManager.processFrontMatter(file, (newFrontMatter) => {
                        if (newFrontMatter !== null) {
                            newFrontMatter.TickTickTasks = updatedFrontMatter.TickTickTasks;
                            newFrontMatter.TickTickCount = updatedFrontMatter.TickTickCount;
                        }
                    });
                }
            });
        }
        */
        
        
        
        
        
        //Complete a task and mark it as completed
        async completeTaskInTheFile(taskId: string) {
            // Get the task file path
            const currentTask = await this.plugin.cacheOperation.loadTaskFromCacheyID(taskId)
            const filepath = currentTask.path
            
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.includes(taskId) && this.plugin.taskParser.hasTickTickTag(line)) {
                    lines[i] = line.replace('[ ]', '[x]')
                    modified = true
                    break
                }
            }
            
            if (modified) {
                const newContent = lines.join('\n')
                await this.app.vault.modify(file, newContent)
            }
        }
        
        // uncheck completed tasks,
        async uncompleteTaskInTheFile(taskId: string) {
            // Get the task file path
            const currentTask = await this.plugin.cacheOperation.loadTaskFromCacheyID(taskId)
            const filepath = currentTask.path
            
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.includes(taskId) && this.plugin.taskParser.hasTickTickTag(line)) {
                    lines[i] = line.replace(/- \[(x|X)\]/g, '- [ ]');
                    modified = true
                    break
                }
            }
            
            if (modified) {
                const newContent = lines.join('\n')
                await this.app.vault.modify(file, newContent)
            }
        }
        
        //add #TickTick at the end of task line, if full vault sync enabled
        async addTickTickTagToFile(filepath: string) {
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if(!this.plugin.taskParser.isMarkdownTask(line)){
                    //console.log(line)
                    //console.log("It is not a markdown task.")
                    continue;
                }
                //if content is empty
                if(this.plugin.taskParser.getTaskContentFromLineText(line) == ""){
                    //console.log("Line content is empty")
                    continue;
                }
                if (!this.plugin.taskParser.hasTickTickId(line) && !this.plugin.taskParser.hasTickTickTag(line)) {
                    //console.log(line)
                    //console.log('prepare to add TickTick tag')
                    const newLine = this.plugin.taskParser.addTickTickTag(line);
                    //console.log(newLine)
                    lines[i] = newLine
                    modified = true
                }
            }
            
            if (modified) {
                console.log(`New task found in files ${filepath}`)
                const newContent = lines.join('\n')
                //console.log(newContent)
                await this.app.vault.modify(file, newContent)
                
                //update filemetadate
                const metadata = await this.plugin.cacheOperation.getFileMetadata(filepath)
                if(!metadata){
                    await this.plugin.cacheOperation.newEmptyFileMetadata(filepath)
                }
                
            }
        }
        
        
        
        //add TickTick at the line
        async addTickTickLinkToFile(filepath: string) {
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (this.plugin.taskParser.hasTickTickId(line) && this.plugin.taskParser.hasTickTickTag(line)) {
                    if(this.plugin.taskParser.hasTickTickLink(line)){
                        return
                    }
                    console.log(line)
                    //console.log('prepare to add TickTick link')
                    const taskID = this.plugin.taskParser.getTickTickIdFromLineText(line)
                    const taskObject = this.plugin.cacheOperation.loadTaskFromCacheyID(taskID)
                    const TickTickLink = taskObject.url
                    const link = `[link](${TickTickLink})`
                    const newLine = this.plugin.taskParser.addTickTickLink(line,link)
                    console.log(newLine)
                    lines[i] = newLine
                    modified = true
                }else{
                    continue
                }
            }
            
            if (modified) {
                const newContent = lines.join('\n')
                //console.log(newContent)
                await this.app.vault.modify(file, newContent)
                
                
                
            }
        }
        
        
        //add #TickTick at the end of task line, if full vault sync enabled
        async addTickTickTagToLine(filepath:string,lineText:string,lineNumber:number,fileContent:string) {
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = fileContent
            
            const lines = content.split('\n')
            let modified = false
            
            
            const line = lineText
            if(!this.plugin.taskParser.isMarkdownTask(line)){
                //console.log(line)
                //console.log("It is not a markdown task.")
                return;
            }
            //if content is empty
            if(this.plugin.taskParser.getTaskContentFromLineText(line) == ""){
                //console.log("Line content is empty")
                return;
            }
            if (!this.plugin.taskParser.hasTickTickId(line) && !this.plugin.taskParser.hasTickTickTag(line)) {
                //console.log(line)
                //console.log('prepare to add TickTick tag')
                const newLine = this.plugin.taskParser.addTickTickTag(line);
                //console.log(newLine)
                lines[lineNumber] = newLine
                modified = true
            }
            
            
            if (modified) {
                console.log(`New task found in files ${filepath}`)
                const newContent = lines.join('\n')
                console.log(newContent)
                await this.app.vault.modify(file, newContent)
                
                //update filemetadate
                const metadata = await this.plugin.cacheOperation.getFileMetadata(filepath)
                if(!metadata){
                    await this.plugin.cacheOperation.newEmptyFileMetadata(filepath)
                }
                
            }
        }
        
        // sync updated task content to file
        async syncUpdatedTaskContentToTheFile(evt:Object) {
            const taskId = evt.object_id
            // Get the task file path
            const currentTask = await this.plugin.cacheOperation.loadTaskFromCacheyID(taskId)
            const filepath = currentTask.path
            
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.includes(taskId) && this.plugin.taskParser.hasTickTickTag(line)) {
                    const oldTaskContent = this.plugin.taskParser.getTaskContentFromLineText(line)
                    const newTaskContent = evt.extra_data.content
                    
                    lines[i] = line.replace(oldTaskContent, newTaskContent)
                    modified = true
                    break
                }
            }
            
            if (modified) {
                const newContent = lines.join('\n')
                //console.log(newContent)
                await this.app.vault.modify(file, newContent)
            }
            
        }
        
        // sync updated task due date to the file
        async syncUpdatedTaskDueDateToTheFile(evt:Object) {
            const taskId = evt.object_id
            // Get the task file path
            const currentTask = await this.plugin.cacheOperation.loadTaskFromCacheyID(taskId)
            const filepath = currentTask.path
            
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.includes(taskId) && this.plugin.taskParser.hasTickTickTag(line)) {
                    const oldTaskDueDate = this.plugin.taskParser.getDueDateFromLineText(line) || ""
                    const newTaskDueDate = this.plugin.taskParser.ISOStringToLocalDateString(evt.extra_data.due_date) || ""
                    
                    //console.log(`${taskId} duedate is updated`)
                    console.log(oldTaskDueDate)
                    console.log(newTaskDueDate)
                    if(oldTaskDueDate === ""){
                        //console.log(this.plugin.taskParser.insertDueDateBeforeTickTick(line,newTaskDueDate))
                        lines[i] = this.plugin.taskParser.insertDueDateBeforeTickTick(line,newTaskDueDate)
                        modified = true
                        
                    }
                    else if(newTaskDueDate === ""){
                        //remove date from text
                        const regexRemoveDate = /(🗓️|📅|📆|🗓)\s?\d{4}-\d{2}-\d{2}/; //Matching date 🗓️2023-03-07"
                        lines[i] = line.replace(regexRemoveDate,"")
                        modified = true
                    }
                    else{
                        
                        lines[i] = line.replace(oldTaskDueDate, newTaskDueDate)
                        modified = true
                    }
                    break
                }
            }
            
            if (modified) {
                const newContent = lines.join('\n')
                //console.log(newContent)
                await this.app.vault.modify(file, newContent)
            }
            
        }
        
        
        // sync new task note to file
        async syncAddedTaskNoteToTheFile(evt:Object) {
            
            
            const taskId = evt.parent_item_id
            const note = evt.extra_data.content
            const datetime = this.plugin.taskParser.ISOStringToLocalDatetimeString(evt.event_date)
            // Get the task file path
            const currentTask = await this.plugin.cacheOperation.loadTaskFromCacheyID(taskId)
            const filepath = currentTask.path
            
            // Get the file object and update the content
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            let modified = false
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i]
                if (line.includes(taskId) && this.plugin.taskParser.hasTickTickTag(line)) {
                    const indent = '\t'.repeat(line.length - line.trimStart().length + 1);
                    const noteLine = `${indent}- ${datetime} ${note}`;
                    lines.splice(i + 1, 0, noteLine);
                    modified = true
                    break
                }
            }
            
            if (modified) {
                const newContent = lines.join('\n')
                //console.log(newContent)
                await this.app.vault.modify(file, newContent)
            }
            
        }
        
        
        //Avoid using this method, you can get real-time updated value through view
        async readContentFromFilePath(filepath:string){
            try {
                const file = this.app.vault.getAbstractFileByPath(filepath);
                const content = await this.app.vault.read(file);
                return content
            } catch (error) {
                console.error(`Error loading content from ${filepath}: ${error}`);
                return false;
            }
        }
        
        //get line text from file path
        //Please use view.editor.getLine, the read method has a delay
        async getLineTextFromFilePath(filepath:string,lineNumber:string) {
            
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const content = await this.app.vault.read(file)
            
            const lines = content.split('\n')
            return(lines[lineNumber])
        }
        
        //search TickTick_id by content
        async searchTickTickIdFromFilePath(filepath: string, searchTerm: string): string | null {
            const file = this.app.vault.getAbstractFileByPath(filepath)
            const fileContent = await this.app.vault.read(file)
            const fileLines = fileContent.split('\n');
            let TickTickId: string | null = null;
            
            for (let i = 0; i < fileLines.length; i++) {
                const line = fileLines[i];
                
                if (line.includes(searchTerm)) {
                    const regexResult = /\[TickTick_id::\s*(\w+)\]/.exec(line);
                    
                    if (regexResult) {
                        TickTickId = regexResult[1];
                    }
                    
                    break;
                }
            }
            
            return TickTickId;
        }
        
        //get all files in the vault
        async getAllFilesInTheVault(){
            const files = this.app.vault.getFiles()
            return(files)
        }
        
        //search filepath by taskid in vault
        async searchFilepathsByTaskidInVault(taskId:string){
            console.log(`preprare to search task ${taskId}`)
            const files = await this.getAllFilesInTheVault()
            //console.log(files)
            const tasks = files.map(async (file) => {
                if (!this.isMarkdownFile(file.path)) {
                    return;
                }
                const fileContent = await this.app.vault.cachedRead(file);
                if (fileContent.includes(taskId)) {
                    return file.path;
                }
            });
            
            const results = await Promise.all(tasks);
            const filePaths = results.filter((filePath) => filePath !== undefined);
            return filePaths[0] || null;
            //return filePaths || null
        }
        
        
        isMarkdownFile(filename:string) {
            // Get the extension of the file name
            let extension = filename.split('.').pop();
            
            //Convert the extension to lowercase (the extension of Markdown files is usually .md)
            extension = extension.toLowerCase();
            
            // Determine whether the extension is .md
            if (extension === 'md') {
                return true;
            } else {
                return false;
            }
        }
        
        
        
        
        
    }
    