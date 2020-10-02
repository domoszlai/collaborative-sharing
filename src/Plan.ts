import {isSharable, getSharableProps, isTitle, isId, isNodeClass} from './Annotation'

abstract class SharableProperty {

    constructor(title: string, propertyKey: string)
    {
        this.title = title;
        this.propertyKey = propertyKey;
    }

    getTitle()
    {
        return this.title;
    }

    getPropertyKey()
    {
        return this.propertyKey;
    }

    private title: string
    private propertyKey: string
}

abstract class SharableElement {

    constructor(id: any, title: string)
    {
        this.id = id
        this.title = title;
    }

    getTitle()
    {
        return this.title;
    }

    getId()
    {
        return this.id;
    }

    private title: string
    private id: any
}

export class SharablePropertyScalar extends SharableProperty {

    constructor(title: string, propertyKey: string, value: any)
    {
        super(title, propertyKey)
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    private value: any
}

export class SharablePropertyObject extends SharableProperty {

    constructor(title: string, propertyKey: string, sharables: SharableProperty[])
    {
        super(title, propertyKey)
        this.sharables = sharables;
    }

    getSharables() {
        return this.sharables;
    }

    private sharables: SharableProperty[]
}

export class SharablePropertyArray extends SharableProperty {

    constructor(title: string, propertyKey: string, sharables: SharableElement[])
    {
        super(title, propertyKey)
        this.sharables = sharables;
    }

    getSharables() {
        return this.sharables;
    }

    private sharables: SharableElement[]
}

export class SharableElementScalar extends SharableElement {

    constructor(id: any, title: string, value: any)
    {
        super(id, title)
        this.value = value;
    }

    getValue() {
        return this.value;
    }

    private value: any
}

export class SharableElementObject extends SharableElement {

    constructor(id: any, title: string, sharables: SharableProperty[])
    {
        super(id, title)
        this.sharables = sharables;
    }

    getSharables() {
        return this.sharables;
    }

    private sharables: SharableProperty[]
}

export class SharableElementArray extends SharableElement {

    constructor(id: any, title: string, sharables: SharableElement[])
    {
        super(id, title)
        this.sharables = sharables;
    }

    getSharables() {
        return this.sharables;
    }

    private sharables: SharableElement[]
}

function getValue(obj: any, propName: string)
{
    let val = obj[propName];

    if(typeof val === 'function'){
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
    for(var m in obj) {
        if(isTitle(obj, m))
        {
            return getValue(obj, m)
        }
    }

    return undefined
}

function getId(obj: any)
{
    for(var m in obj) {
        if(isId(obj, m))
        {
            return getValue(obj, m)
        }
    }

    return undefined
}

function getSharableElements(arr: any[])
{
    let sharables: SharableElement[] = []

    for(var e of arr) {
        if(e !== null)
        {
            if(isNodeClass(e))
            {
                let id = getId(e)
                let title = getTitle(e)
                sharables.push(new SharableElementObject(id, title, getSharablesValues(e)))
            }
            else if(typeof e === 'object')
            {
                let id = getId(e)
                let title = getTitle(e)
                sharables.push(new SharableElementScalar(id, title, e))
            }
            else if(Array.isArray(e))
            {
                let id = getId(e)
                let title = getTitle(e)
                sharables.push(new SharableElementArray(id, title, getSharableElements(e)))
            }
            else
            {
                sharables.push(new SharableElementScalar(e, e.toString(), e))
            }
        }
    }

    return sharables
}

function getSharablesValues(obj: any)
{
    let sharables: SharableProperty[] = []

    for(var m in obj) {
        if(isSharable(obj, m))
        {
            let props = getSharableProps(obj, m)
            let val = getValue(obj, m)

            console.log(m, val)

            if(isNodeClass(val) && !props.forceToLeaf)
            {
                sharables.push(new SharablePropertyObject(props.title, m, getSharablesValues(val)))
            }
            else if(Array.isArray(val) && !props.forceToLeaf)
            {
                sharables.push(new SharablePropertyArray(props.title, m, getSharableElements(val)))
            }
            else
            {
                sharables.push(new SharablePropertyScalar(props.title, m, val))
            }
        }
    }   
    
    return sharables;
}

export class Plan {
    constructor (sharables: SharableProperty[])
    {
        this.sharables = sharables;
    }

    getSharables(){
        return this.sharables;
    }

    private sharables: SharableProperty[]
}

export function makePlan(obj: any)
{
    if(isNodeClass(obj))
    {
        return new Plan(getSharablesValues(obj))
    }
    else
    {
        return new Plan([])
    }
}