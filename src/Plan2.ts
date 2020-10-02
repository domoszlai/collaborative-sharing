import {classToPlain} from "class-transformer"
import {isSharable, getSharableProps, isTitle, isId} from './Annotation'
import {isNodeClass, getNodeProps} from './Annotation'

enum SharableEnabled 
{
    Enabled,
    Disabled,
    PartiallyEnabled
}

export abstract class SharableNode 
{
    constructor(title: string)
    {
        this.title = title;
    }

    getTitle()
    {
        return this.title;
    }

    //abstract setEnabled(enabled: boolean): void
    //abstract getEnabled(): SharableEnabled

    abstract isLeaf(): boolean

    getSharables(): SharableNode[] {
        return []
    }

    getvalue(): any {
        return undefined
    }

    abstract serialize(): any;

    private title: string
}

function serializeLeaf(value: any)
{
    let nodeProps = getNodeProps(value)
    let serializeFn = nodeProps?.serializeFn ?? classToPlain
    let ret = serializeFn(value)

    if(typeof ret === "object" && nodeProps)
    {
        ret["__type"] = nodeProps.id
    }

    return ret
}

function fromEntries<T>(entries: [keyof T, T[keyof T]][]): T {
    return entries.reduce(
      (acc, [key, value]) => ({ ...acc, [key]: value }),
      <T>{}
    );
  }

export class SharableScalar extends SharableNode 
{
    constructor(title: string, value: any)
    {
        super(title)
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    isLeaf() {
        return true;
    }

    serialize() {
        return {"__type": "SharableScalar", 
                "title": this.getTitle(), 
                "value": serializeLeaf(this.value)}
    }

    private value: any
}

export class SharableObject extends SharableNode 
{
    constructor(title: string)
    {
        super(title)
        this.sharables = new Map()
        this.ids = new Map()
    }

    getSharables() {
        return Array.from(this.sharables.values())
    }

    addSharable(propertykey: string, sharable: SharableNode)
    {
        this.sharables.set(propertykey, sharable)
    }

    addId(propertykey: string, val: any)
    {
        this.ids.set(propertykey, val)
    }

    isLeaf() {
        return false;
    }

    serialize() {
        const ids = Array.from(this.ids.entries()).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: classToPlain(value)}), {}
          );

        const sharables = Array.from(this.sharables.entries()).reduce(
            (acc, [key, value]) => ({ ...acc, [key]: value.serialize()}), {}
          );

        return {"__type": "SharableObject", 
                "title": this.getTitle(),
                "ids": ids,
                "sharables": sharables}
    }

    private ids: Map<string,any>
    private sharables: Map<string,SharableNode>
}

export class SharableArray extends SharableNode 
{
    constructor(title: string)
    {
        super(title)
        this.sharables = []
    }

    getSharables() {
        return this.sharables
    }

    addSharable(sharable: SharableNode)
    {
        this.sharables.push(sharable)
    }

    isLeaf() {
        return false;
    }

    serialize() {
        const sharables = this.sharables.map( s => s.serialize());

        return {"__type": "SharableArray", 
                "title": this.getTitle(),
                "sharables": sharables}
    }

    private sharables: SharableNode[]
}

function getValue(obj: any, propName: string)
{
    let val = obj[propName];

    if(typeof val === 'function')
    {
        if(val.length == 0)
        {
            val = val()
        }
        else
        {
            val = null
        }
    }

    return val
}

function getTitle(obj: any)
{
    for(var m in obj) 
    {
        if(isTitle(obj, m))
        {
            return getValue(obj, m)
        }
    }

    return undefined
}

function addIds(node: SharableObject, obj: any)
{
    let ret: [string, any][] = []

    for(var m in obj) 
    {
        if(isId(obj, m))
        {
            ret.push([m, getValue(obj, m)])
        }
    }

    return ret
}

function addSharableElements(node: SharableArray, arr: any[])
{
    for(var e of arr) 
    {
        if(e !== null)
        {
            if(isNodeClass(e))
            {
                let title = getTitle(e)
                let subNode = new SharableObject(title)
                addIds(subNode, e)
                addSharablesProperties(subNode, e)
                node.addSharable(subNode)
            }
            else if(typeof e === 'object')
            {                
                let title = getTitle(e)
                node.addSharable(new SharableScalar(title, e))
            }
            else if(Array.isArray(e))
            {
                let title = getTitle(e)
                let subNode = new SharableArray(title)
                addSharableElements(subNode, e)
                node.addSharable(subNode)
            }
            else
            {
                node.addSharable(new SharableScalar(e.toString(), e))
            }
        }
    }
}

function addSharablesProperties(node: SharableObject, obj: any)
{
    for(var m in obj) 
    {
        if(isSharable(obj, m))
        {
            let props = getSharableProps(obj, m)
            let val = getValue(obj, m)

            if(isNodeClass(val) && !props.forceToLeaf)
            {
                let subNode = new SharableObject(props.title)
                addSharablesProperties(subNode, val)
                node.addSharable(m, subNode)
            }
            else if(Array.isArray(val) && !props.forceToLeaf)
            {
                let subNode = new SharableArray(props.title)
                addSharableElements(subNode, val)
                node.addSharable(m, subNode)
            }
            else
            {
                node.addSharable(m, new SharableScalar(props.title, val));
            }
        }
    }   
}

export function makePlan(obj: any, rootTitle: string)
{
    let node = new SharableObject(rootTitle)
    addSharablesProperties(node, obj)
    return node
}