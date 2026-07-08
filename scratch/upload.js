const fs = require('fs');

const url = "https://mod-system-content-jp-mobile-nexoncdn.s3.ap-northeast-1.amazonaws.com/mcp/2b/87/7d220bac/2026/07/08/848671b5-d614-4338-b8de-d41d38198c67/2b871729-ec97-44e2-adbc-f29ae8f353c2?X-Amz-Expires=3600&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELT%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaDmFwLW5vcnRoZWFzdC0xIkYwRAIgLgrh7EJT%2FMhNHEl3Xu6gjHr2DE9iiwZlSLnaKtE4K4sCIGu0%2BFzCnViJuxbbZ%2B7xt14t9PsohKIyG0uJbm65mZOaKpEFCH0QARoMNDI4NTg1MTI4OTM1IgweTJMPz28gQyCCgo4q7gR87fkc5%2FC62qf8OfDREQU1L8HzIq11m2WXJ%2FORYcQnTT9EkYGZ1jmTqhTxI5eo94ndTqrRlUX6srqASgBA7h0cnXP8wlgF4LZiY0rhZwgnL8wxYh3Mz0p8dIMCpDRCrCTO8uLxJVjhQG0uuIg%2FlOvHAzbNSvQbjwigOlhj0kvTSc5npPh0kH%2FlpdKxvAp5tL4j2j4%2BkVgiUc33%2BbURQs4Iosxm9%2Fb%2FYyNvHvoki37HMtmvvON571UvbcGQyDDkrm75BEF8tGirwClEe1164iPC2c5nPei1M6G8DqZyeJtIDT9BOEOiLqlriNdK5r6pSMrWV%2BsoXrDacL0rqEf8%2BtNE5UXbipRjeLmQnXwlL5RywL1Xim6y5UqRq70yOqXtV1pSRhEQi2xJPbv3qqxduD%2FPb3rVMwS9b6cPXsmZ7fUd1oZD%2BQNfivHC2D3jFF9CremqFzsmNcBu9VLYjD5e22DsRrl7eRyJyHvRgxQvHaE39KHEle2Wj2mmEflzvHT517aDZrjeBy55YXcSPyEMiVvOubV%2Fcuu7yFI57AT%2FlAeQtfAHg5yiCV0GLuX0h8bmJgAHKe3Kv6u8lahPvmfbE7vW9DblcJB5zR0Jks%2B%2BX9FHnVOy1HQ9r8oQHtfoPEHZobHiktG83LLxjZGES%2BbHRpfXUlXxMmv3sn2KmlBCPHxiWDebgAbRDNhEPIUbAC7q2RmYp4IVGASDuiXsOgOYGKmd0KMn8dtx3Y7ZiL87PGn14q2Kkq6icdFHmMH4zlF5wAeUNhR7MfLgHkgzeQUvg3pjAKKLtV1e%2FIZ0lu3C7uqcFztQKba2FwVdjF63ypwnMK2Pt9IGOpkBUhsM0Cf%2B8Z%2BCaQOUJsW8II02F0LFOFOBooMlb%2FLmZ%2FYjI%2BsxkbHnNLukOM8%2FE0U2vKn4rr1bcV6hUrVY6EwWQos0ktqoHa0owTAOZp59CvGajLJdgSoOSp2n4jqII5DcKEq82JcGHsNvZRNQtt8IA5KInNrUuiXOloWPrO3wa00xzR2EdvC2ZIdt9r3LiJxrPbWCwNTEXeGi&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAWHSNKCPT5V2RRWBL%2F20260708%2Fap-northeast-1%2Fs3%2Faws4_request&X-Amz-Date=20260708T041629Z&X-Amz-SignedHeaders=content-length%3Bhost&X-Amz-Signature=088fb49a8701feeda5d8591ddade67b4f60dd564d7e93b7c042887b030bbbf60";

const fileData = fs.readFileSync('scratch/house_steep_render.png');

fetch(url, {
  method: 'PUT',
  body: fileData,
  headers: {
    'Content-Length': fileData.length,
    'Host': 'mod-system-content-jp-mobile-nexoncdn.s3.ap-northeast-1.amazonaws.com'
  }
}).then(res => {
  console.log('Status:', res.status);
  return res.text();
}).then(text => {
  console.log('Response:', text);
}).catch(err => {
  console.error('Error:', err);
});
